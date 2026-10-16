import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Token } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';
import { RealtimeService } from '../realtime/realtime.service';
import {
  ActivateTokenDto,
  BatchTokenDto,
  CreateTokenDto,
} from './tokens.dto';

@Injectable()
export class TokensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly spaces: SpacesService,
    private readonly realtime: RealtimeService,
  ) {}

  async create(userId: string, spaceId: string, dto: CreateTokenDto) {
    await this.assertFull(userId, spaceId);
    const plaintext = this.generate();
    const record = await this.prisma.token.create({
      data: {
        space_id: spaceId,
        token_hash: this.hash(plaintext),
        preset: dto.preset,
        created_by: userId,
        expires_at: dto.expires_at ?? null,
      },
    });
    return { ...this.publicToken(record), token: plaintext };
  }

  async batch(userId: string, dto: BatchTokenDto) {
    await this.assertFull(userId, dto.space_id);
    const count = dto.count ?? 1;
    const created: Array<ReturnType<typeof this.publicToken> & { token: string }> =
      [];
    for (let index = 0; index < count; index += 1) {
      const plaintext = this.generate();
      const record = await this.prisma.token.create({
        data: {
          space_id: dto.space_id,
          token_hash: this.hash(plaintext),
          preset: dto.preset,
          created_by: userId,
          expires_at: dto.expires_at ?? null,
        },
      });
      created.push({ ...this.publicToken(record), token: plaintext });
    }
    return created;
  }

  async list(userId: string, spaceId: string) {
    await this.assertFull(userId, spaceId);
    const tokens = await this.prisma.token.findMany({
      where: { space_id: spaceId },
      orderBy: { created_at: 'desc' },
      include: {
        creator: { select: { id: true, name: true } },
        used_by_user: { select: { id: true, name: true } },
      },
    });
    return tokens.map((token) => ({
      ...this.publicToken(token),
      creator: token.creator,
      used_by_user: token.used_by_user,
    }));
  }

  async revoke(userId: string, tokenId: string) {
    const token = await this.prisma.token.findUnique({
      where: { id: tokenId },
      select: { id: true, space_id: true, revoked_at: true },
    });
    if (!token) {
      throw new NotFoundException('Токен не найден');
    }
    await this.assertFull(userId, token.space_id);
    if (!token.revoked_at) {
      await this.prisma.token.update({
        where: { id: tokenId },
        data: { revoked_at: new Date() },
      });
    }
    return { success: true };
  }

  async activate(userId: string, plaintext: string, dto: ActivateTokenDto) {
    const token = await this.prisma.token.findUnique({
      where: { token_hash: this.hash(plaintext) },
    });
    if (!token) {
      throw new NotFoundException('Токен не найден');
    }
    if (token.revoked_at) {
      throw new BadRequestException('Токен отозван');
    }
    if (token.used_at) {
      throw new ConflictException('Токен уже использован');
    }
    if (token.expires_at && token.expires_at.getTime() < Date.now()) {
      throw new BadRequestException('Срок действия токена истёк');
    }

    const claim = await this.prisma.token.updateMany({
      where: { id: token.id, used_at: null, revoked_at: null },
      data: { used_at: new Date(), used_by: userId },
    });
    if (claim.count === 0) {
      throw new ConflictException('Токен уже использован или отозван');
    }

    await this.prisma.spaceMember.upsert({
      where: { space_id_user_id: { space_id: token.space_id, user_id: userId } },
      update: { preset: token.preset, revoked_at: null },
      create: {
        space_id: token.space_id,
        user_id: userId,
        preset: token.preset,
      },
    });

    if (dto.name) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { name: dto.name },
      });
    }

    this.realtime.memberJoined(token.space_id, userId, token.preset);
    this.realtime.tokenActivated(token.space_id, userId, token.preset);

    return { success: true, space_id: token.space_id, preset: token.preset };
  }

  private async assertFull(userId: string, spaceId: string) {
    const access = await this.spaces.getAccess(userId, spaceId);
    if (access.preset !== 'FULL') {
      throw new ForbiddenException('Требуется полный доступ');
    }
    return access;
  }

  private generate() {
    return randomBytes(32).toString('base64url');
  }

  private hash(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private publicToken(token: Token) {
    return {
      id: token.id,
      space_id: token.space_id,
      preset: token.preset,
      created_by: token.created_by,
      expires_at: token.expires_at,
      used_at: token.used_at,
      used_by: token.used_by,
      revoked_at: token.revoked_at,
      created_at: token.created_at,
    };
  }
}
