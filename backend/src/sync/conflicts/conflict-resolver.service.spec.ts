import {
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProviderFactory } from '../providers/provider.factory';
import { ConflictResolverService } from './conflict-resolver.service';

const EVENT_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

const localData = {
  title: 'Локально',
  description: null,
  start_at: '2026-12-01T10:00:00.000Z',
  end_at: '2026-12-01T11:00:00.000Z',
  all_day: false,
  timezone: 'UTC',
  location: null,
  rrule: null,
};

const externalData = {
  ...localData,
  title: 'Внешне',
  start_at: '2026-12-01T12:00:00.000Z',
  end_at: '2026-12-01T13:00:00.000Z',
};

const event = {
  id: EVENT_ID,
  source_id: 'src1',
  creator_id: 'u1',
  title: 'Локально',
  description: null,
  start_at: new Date('2026-12-01T10:00:00.000Z'),
  end_at: new Date('2026-12-01T11:00:00.000Z'),
  all_day: false,
  timezone: 'UTC',
  location: null,
  rrule: null,
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
  external_id: 'remote',
  external_provider: 'yandex',
  external_etag: '"old"',
  sync_status: 'pending',
  last_synced_at: null,
  recurrence_parent_id: null,
  recurrence_exceptions: null,
};

const conflict = {
  id: 'conf1',
  event_id: EVENT_ID,
  external_connection_id: 'conn1',
  local_data: localData,
  external_data: externalData,
  external_etag: '"ext"',
  resolution: null,
  resolved_at: null,
  created_at: new Date(),
  event,
};

const connection = {
  id: 'conn1',
  user_id: 'user1',
  provider: 'yandex',
  caldav_url: 'http://x',
  caldav_username: 'u',
  caldav_password_enc: 'e',
};

function build(overrides: { conflict?: unknown; connection?: unknown } = {}) {
  const prisma = {
    syncConflict: {
      findFirst: jest
        .fn()
        .mockResolvedValue(overrides.conflict ?? conflict),
      update: jest.fn((args: any) =>
        Promise.resolve({ id: args.where.id, ...args.data }),
      ),
    },
    externalConnection: {
      findFirst: jest
        .fn()
        .mockResolvedValue(
          overrides.connection === undefined ? connection : overrides.connection,
        ),
    },
    sourceExternalMap: {
      findFirst: jest.fn().mockResolvedValue({
        id: 'map1',
        external_calendar_id: 'cal1',
        sync_status: 'active',
        sync_direction: 'both',
        external_connection: connection,
      }),
    },
    event: {
      update: jest.fn((args: any) =>
        Promise.resolve({ id: args.where.id, ...args.data }),
      ),
    },
    eventException: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
  const forcePush = jest
    .fn()
    .mockResolvedValue({ uid: 'remote', etag: '"new"', ical: '' });
  const factory = { create: jest.fn().mockReturnValue({ forcePush }) };
  const service = new ConflictResolverService(
    prisma as unknown as PrismaService,
    factory as unknown as ProviderFactory,
  );
  return { service, prisma, forcePush, factory };
}

describe('ConflictResolverService', () => {
  it('resolve(local) перезаписывает внешний объект и помечает конфликт (local)', async () => {
    const { service, prisma, forcePush } = build();

    const result = await service.resolve('user1', 'conf1', {
      resolution: 'local',
    });

    expect(forcePush).toHaveBeenCalledWith(
      'cal1',
      expect.objectContaining({ uid: 'remote', etag: '"old"' }),
    );
    expect(prisma.event.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          external_etag: '"new"',
          sync_status: 'synced',
        }),
      }),
    );
    expect(prisma.syncConflict.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ resolution: 'local' }),
      }),
    );
    expect(result.id).toBe(EVENT_ID);
  });

  it('resolve(external) применяет внешний снимок и не пишет наружу', async () => {
    const { service, prisma, forcePush } = build();

    await service.resolve('user1', 'conf1', { resolution: 'external' });

    const call = prisma.event.update.mock.calls[0][0];
    expect(call.data.title).toBe('Внешне');
    expect(call.data.start_at).toEqual(new Date(externalData.start_at));
    expect(call.data.external_etag).toBe('"ext"');
    expect(forcePush).not.toHaveBeenCalled();
  });

  it('resolve(merged) накладывает правки на локальную версию и пушит', async () => {
    const { service, prisma, forcePush } = build();

    await service.resolve('user1', 'conf1', {
      resolution: 'merged',
      merged_data: { title: 'Объединили', location: 'Офис' },
    });

    const call = prisma.event.update.mock.calls[0][0];
    expect(call.data.title).toBe('Объединили');
    expect(call.data.location).toBe('Офис');
    expect(call.data.start_at).toEqual(new Date(localData.start_at));
    expect(forcePush).toHaveBeenCalledTimes(1);
  });

  it('resolve уже разрешённого конфликта → 409', async () => {
    const { service } = build({
      conflict: { ...conflict, resolution: 'local', resolved_at: new Date() },
    });

    await expect(
      service.resolve('user1', 'conf1', { resolution: 'local' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('resolve чужого конфликта → 403', async () => {
    const { service } = build({ connection: null });

    await expect(
      service.resolve('user1', 'conf1', { resolution: 'local' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('resolve(external) без внешнего снимка → 500', async () => {
    const { service } = build({
      conflict: { ...conflict, external_data: {} },
    });

    await expect(
      service.resolve('user1', 'conf1', { resolution: 'external' }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('ошибка forcePush → 503, конфликт не разрешён', async () => {
    const { service, prisma, forcePush } = build();
    forcePush.mockRejectedValueOnce(new Error('сеть'));

    await expect(
      service.resolve('user1', 'conf1', { resolution: 'local' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(prisma.syncConflict.update).not.toHaveBeenCalled();
    expect(prisma.event.update).not.toHaveBeenCalled();
  });
});
