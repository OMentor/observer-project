import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { LoginDto, RegisterDto, RefreshDto } from './auth.dto';
import { JwtPayload } from './jwt.strategy';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Email уже зарегистрирован');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password_hash: passwordHash,
        timezone: dto.timezone ?? 'UTC',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        timezone: true,
      },
    });

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.password_hash))) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        timezone: user.timezone,
      },
      ...tokens,
    };
  }

  async refresh(dto: RefreshDto): Promise<Tokens> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(dto.refreshToken);
    } catch {
      throw new UnauthorizedException('Недействительный refresh-токен');
    }
    if (payload.type !== 'refresh' || !payload.jti) {
      throw new UnauthorizedException('Неверный тип токена');
    }

    const stored = await this.redis.get(this.refreshKey(payload.jti));
    if (stored !== payload.sub) {
      throw new UnauthorizedException('Refresh-токен отозван');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true },
    });
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    await this.redis.del(this.refreshKey(payload.jti));
    return this.issueTokens(user.id, user.email, user.role);
  }

  async logout(refreshToken: string): Promise<{ success: true }> {
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken);
      if (payload.jti) {
        await this.redis.del(this.refreshKey(payload.jti));
      }
    } catch {
      // токен уже недействителен — выходим без ошибки
    }
    return { success: true };
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<Tokens> {
    const jti = randomUUID();
    const accessExpires = this.parseDuration(
      this.config.get<string>('JWT_EXPIRES_IN') ?? '15m',
    );
    const refreshExpires = this.parseDuration(
      this.config.get<string>('REFRESH_TOKEN_EXPIRES_IN') ?? '30d',
    );
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, role, type: 'access' },
      { expiresIn: accessExpires },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: userId, type: 'refresh', jti },
      { expiresIn: refreshExpires },
    );
    await this.redis.set(this.refreshKey(jti), userId, refreshExpires);
    return { accessToken, refreshToken };
  }

  private refreshKey(jti: string): string {
    return `refresh:${jti}`;
  }

  private parseDuration(value: string): number {
    const match = /^(\d+)([smhd])$/.exec(value.trim());
    if (!match) {
      return 30 * 24 * 60 * 60;
    }
    const amount = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 24 * 60 * 60,
    };
    return amount * (multipliers[unit] ?? 1);
  }
}
