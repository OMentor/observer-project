import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TokensService } from './tokens.service';

describe('TokensService', () => {
  let prisma: {
    token: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    spaceMember: { upsert: jest.Mock };
    user: { update: jest.Mock };
  };
  let spaces: { getAccess: jest.Mock };
  let service: TokensService;

  const storedToken = {
    id: 't1',
    space_id: 'sp1',
    token_hash: 'hash',
    preset: 'OWN',
    created_by: 'u1',
    expires_at: null,
    used_at: null,
    used_by: null,
    revoked_at: null,
    created_at: new Date(),
  };

  beforeEach(() => {
    prisma = {
      token: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      spaceMember: { upsert: jest.fn() },
      user: { update: jest.fn() },
    };
    spaces = { getAccess: jest.fn() };
    service = new TokensService(prisma as never, spaces as never);
  });

  it('create возвращает открытый токен один раз и хранит хэш', async () => {
    spaces.getAccess.mockResolvedValue({ isOwner: true, preset: 'FULL' });
    prisma.token.create.mockResolvedValue(storedToken);

    const result = await service.create('u1', 'sp1', { preset: 'OWN' });

    expect(result.token).toEqual(expect.any(String));
    expect((result as Record<string, unknown>).token_hash).toBeUndefined();
    expect(prisma.token.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          space_id: 'sp1',
          preset: 'OWN',
          token_hash: expect.any(String),
        }),
      }),
    );
  });

  it('create запрещён без полного доступа', async () => {
    spaces.getAccess.mockResolvedValue({ isOwner: false, preset: 'OWN' });

    await expect(
      service.create('u1', 'sp1', { preset: 'OWN' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('activate присоединяет участника и помечает токен использованным', async () => {
    prisma.token.findUnique.mockResolvedValue(storedToken);
    prisma.token.updateMany.mockResolvedValue({ count: 1 });
    prisma.spaceMember.upsert.mockResolvedValue({});

    const result = await service.activate('u2', 'plain', {});

    expect(result).toEqual({
      success: true,
      space_id: 'sp1',
      preset: 'OWN',
    });
    expect(prisma.spaceMember.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: { space_id: 'sp1', user_id: 'u2', preset: 'OWN' },
      }),
    );
  });

  it('activate бросает ConflictException при повторном использовании', async () => {
    prisma.token.findUnique.mockResolvedValue(storedToken);
    prisma.token.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.activate('u2', 'plain', {})).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('activate бросает ConflictException для уже использованного токена', async () => {
    prisma.token.findUnique.mockResolvedValue({
      ...storedToken,
      used_at: new Date(),
    });

    await expect(service.activate('u2', 'plain', {})).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('activate бросает BadRequestException для отозванного токена', async () => {
    prisma.token.findUnique.mockResolvedValue({
      ...storedToken,
      revoked_at: new Date(),
    });

    await expect(service.activate('u2', 'plain', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('activate бросает NotFoundException для неизвестного токена', async () => {
    prisma.token.findUnique.mockResolvedValue(null);

    await expect(service.activate('u2', 'plain', {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('revoke помечает токен отозванным', async () => {
    spaces.getAccess.mockResolvedValue({ isOwner: true, preset: 'FULL' });
    prisma.token.findUnique.mockResolvedValue({
      id: 't1',
      space_id: 'sp1',
      revoked_at: null,
    });
    prisma.token.update.mockResolvedValue({});

    await service.revoke('u1', 't1');

    expect(prisma.token.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { revoked_at: expect.any(Date) },
    });
  });
});
