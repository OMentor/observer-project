import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));
import * as bcrypt from 'bcrypt';

const bcryptMock = bcrypt as unknown as {
  hash: jest.Mock;
  compare: jest.Mock;
};

describe('AuthService', () => {
  let prisma: {
    user: { findUnique: jest.Mock; create: jest.Mock };
  };
  let jwt: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let config: { get: jest.Mock };
  let redis: { set: jest.Mock; get: jest.Mock; del: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn(), create: jest.fn() },
    };
    jwt = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
      verifyAsync: jest.fn(),
    };
    config = {
      get: jest.fn((key: string) =>
        key === 'JWT_EXPIRES_IN'
          ? '15m'
          : key === 'REFRESH_TOKEN_EXPIRES_IN'
            ? '30d'
            : undefined,
      ),
    };
    redis = { set: jest.fn(), get: jest.fn(), del: jest.fn() };
    service = new AuthService(
      prisma as never,
      jwt as never,
      config as never,
      redis as never,
    );
    jest.clearAllMocks();
    jwt.signAsync.mockResolvedValue('signed-token');
  });

  describe('register', () => {
    it('бросает ConflictException, если email занят', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });

      await expect(
        service.register({
          name: 'A',
          email: 'a@b.c',
          password: 'password123',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('хеширует пароль и выдаёт токены', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      bcryptMock.hash.mockResolvedValue('hashed');
      prisma.user.create.mockResolvedValue({
        id: 'u1',
        name: 'A',
        email: 'a@b.c',
        role: 'USER',
        timezone: 'UTC',
      });

      const result = await service.register({
        name: 'A',
        email: 'a@b.c',
        password: 'password123',
      });

      expect(bcryptMock.hash).toHaveBeenCalledWith('password123', 10);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ password_hash: 'hashed' }),
        }),
      );
      expect(result.accessToken).toBe('signed-token');
      expect(result.refreshToken).toBe('signed-token');
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringMatching(/^refresh:/),
        'u1',
        30 * 24 * 60 * 60,
      );
    });
  });

  describe('login', () => {
    it('бросает UnauthorizedException при неверном пароле', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        password_hash: 'hashed',
      });
      bcryptMock.compare.mockResolvedValue(false);

      await expect(
        service.login({ email: 'a@b.c', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('возвращает токены при успешном входе', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        name: 'A',
        email: 'a@b.c',
        role: 'USER',
        timezone: 'UTC',
        password_hash: 'hashed',
      });
      bcryptMock.compare.mockResolvedValue(true);

      const result = await service.login({
        email: 'a@b.c',
        password: 'password123',
      });

      expect(result.user.id).toBe('u1');
      expect(result.accessToken).toBe('signed-token');
    });
  });

  describe('refresh', () => {
    it('бросает UnauthorizedException, если токен отозван', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 'u1',
        type: 'refresh',
        jti: 'j1',
      });
      redis.get.mockResolvedValue(null);

      await expect(
        service.refresh({ refreshToken: 'token' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('ротирует токен при валидном refresh', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 'u1',
        type: 'refresh',
        jti: 'j1',
      });
      redis.get.mockResolvedValue('u1');
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.c',
        role: 'USER',
      });

      const result = await service.refresh({ refreshToken: 'token' });

      expect(redis.del).toHaveBeenCalledWith('refresh:j1');
      expect(result.accessToken).toBeDefined();
    });
  });

  describe('logout', () => {
    it('удаляет refresh-ключ', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 'u1',
        type: 'refresh',
        jti: 'j1',
      });

      await service.logout('u1', 'token');

      expect(redis.del).toHaveBeenCalledWith('refresh:j1');
    });
  });
});
