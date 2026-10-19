import { BadRequestException, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { decryptCredential } from '../crypto';
import { ConnectionsService } from './connections.service';

const ENCRYPTION_KEY = randomBytes(32).toString('base64');

describe('ConnectionsService', () => {
  let prisma: {
    externalConnection: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      delete: jest.Mock;
    };
    sourceExternalMap: { deleteMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let factory: { createWithCredentials: jest.Mock; create: jest.Mock };
  let config: { get: jest.Mock };
  let service: ConnectionsService;

  beforeEach(() => {
    prisma = {
      externalConnection: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
      },
      sourceExternalMap: { deleteMany: jest.fn() },
      $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    };
    factory = { createWithCredentials: jest.fn(), create: jest.fn() };
    config = { get: jest.fn().mockReturnValue(ENCRYPTION_KEY) };
    service = new ConnectionsService(
      prisma as never,
      factory as never,
      config as never,
    );
  });

  it('create шифрует пароль и возвращает список календарей', async () => {
    factory.createWithCredentials.mockReturnValue({
      listCalendars: jest
        .fn()
        .mockResolvedValue([{ id: 'c1', name: 'Личный' }]),
    });
    prisma.externalConnection.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: 'conn1', ...data }),
    );

    const result = await service.create('u1', {
      provider: 'yandex',
      url: 'http://localhost:5232',
      username: 'dev',
      password: 'secret',
    });

    expect(result.calendars).toEqual([{ id: 'c1', name: 'Личный' }]);
    const createArg = prisma.externalConnection.create.mock.calls[0][0];
    expect(createArg.data.caldav_password_enc).not.toBe('secret');
    expect(
      decryptCredential(createArg.data.caldav_password_enc, ENCRYPTION_KEY),
    ).toBe('secret');
  });

  it('create с apple отклоняется', async () => {
    factory.createWithCredentials.mockImplementation(() => {
      throw new BadRequestException('Apple is deferred to Stage 7');
    });

    await expect(
      service.create('u1', {
        provider: 'apple',
        url: 'http://x',
        username: 'u',
        password: 'p',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('findAll не возвращает секреты', async () => {
    prisma.externalConnection.findMany.mockResolvedValue([
      {
        id: 'conn1',
        provider: 'yandex',
        caldav_url: 'http://localhost:5232',
        caldav_username: 'dev',
        caldav_password_enc: 'ENCRYPTED',
        sync_status: 'active',
        last_sync_at: null,
        last_error: null,
      },
    ]);

    const result = await service.findAll('u1');

    expect(result).toEqual([
      {
        id: 'conn1',
        provider: 'yandex',
        url: 'http://localhost:5232',
        username: 'dev',
        sync_status: 'active',
        last_sync_at: null,
        last_error: null,
      },
    ]);
    expect(result[0]).not.toHaveProperty('caldav_password_enc');
  });

  it('remove бросает NotFound для чужого подключения', async () => {
    prisma.externalConnection.findFirst.mockResolvedValue(null);

    await expect(service.remove('u1', 'conn1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
