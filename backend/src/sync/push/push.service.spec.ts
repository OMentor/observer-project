import { PrismaService } from '../../prisma/prisma.service';
import { ProviderFactory } from '../providers/provider.factory';
import { SyncConflictError } from '../sync-errors';
import { PushService } from './push.service';

const connection = {
  id: 'conn1',
  user_id: 'user1',
  provider: 'yandex' as const,
  caldav_url: 'http://x',
  caldav_username: 'u',
  caldav_password_enc: 'enc',
};

function baseEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    source_id: 'src1',
    creator_id: 'u1',
    title: 'Созвон',
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
    external_id: null,
    external_provider: null,
    external_etag: null,
    sync_status: 'local',
    last_synced_at: null,
    recurrence_parent_id: null,
    recurrence_exceptions: null,
    ...overrides,
  };
}

interface Harness {
  service: PushService;
  prisma: any;
  push: jest.Mock;
  remove: jest.Mock;
}

function build(params: {
  event?: unknown;
  map?: unknown;
  pushError?: Error;
  openConflict?: unknown;
}): Harness {
  const push = jest.fn();
  const remove = jest.fn();
  if (params.pushError) {
    push.mockRejectedValue(params.pushError);
  } else {
    push.mockResolvedValue({ uid: 'uid', etag: '"etag"', ical: '' });
  }
  remove.mockResolvedValue(undefined);

  const prisma = {
    event: {
      findUnique: jest.fn().mockResolvedValue(params.event ?? baseEvent()),
      update: jest.fn((args: any) =>
        Promise.resolve({ id: args.where.id, ...args.data }),
      ),
    },
    sourceExternalMap: {
      findFirst: jest.fn().mockResolvedValue(
        params.map === undefined
          ? {
              id: 'map1',
              external_calendar_id: 'cal1',
              sync_direction: 'both',
              sync_status: 'active',
              external_connection: connection,
            }
          : params.map,
      ),
    },
    syncConflict: {
      findFirst: jest.fn().mockResolvedValue(params.openConflict ?? null),
      create: jest.fn().mockResolvedValue({ id: 'conf1' }),
    },
  };
  const factory = {
    create: jest.fn().mockReturnValue({ push, delete: remove }),
  };
  const service = new PushService(
    prisma as unknown as PrismaService,
    factory as unknown as ProviderFactory,
  );
  return { service, prisma, push, remove };
}

describe('PushService', () => {
  it('пропускает событие источника без связи с внешним календарём', async () => {
    const { service, push } = build({ map: null });

    const outcome = await service.pushEvent('11111111-1111-1111-1111-111111111111');

    expect(outcome).toBe('skipped');
    expect(push).not.toHaveBeenCalled();
  });

  it('пропускает источник с направлением только «in»', async () => {
    const { service, push } = build({
      map: {
        id: 'map1',
        external_calendar_id: 'cal1',
        sync_direction: 'in',
        sync_status: 'active',
        external_connection: connection,
      },
    });

    const outcome = await service.pushEvent('11111111-1111-1111-1111-111111111111');

    expect(outcome).toBe('skipped');
    expect(push).not.toHaveBeenCalled();
  });

  it('создаёт новое событие во внешнем календаре (external_id = null)', async () => {
    const { service, prisma, push } = build({});

    const outcome = await service.pushEvent(
      '11111111-1111-1111-1111-111111111111',
    );

    expect(outcome).toBe('created');
    expect(push).toHaveBeenCalledWith(
      'cal1',
      expect.objectContaining({ uid: '11111111-1111-1111-1111-111111111111', etag: null }),
    );
    expect(prisma.event.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          external_id: 'uid',
          external_etag: '"etag"',
          external_provider: 'yandex',
          sync_status: 'synced',
        }),
      }),
    );
  });

  it('обновляет существующее внешнее событие с If-Match (etag)', async () => {
    const { service, push } = build({
      event: baseEvent({ external_id: 'remote', external_etag: '"old"' }),
    });

    const outcome = await service.pushEvent(
      '11111111-1111-1111-1111-111111111111',
    );

    expect(outcome).toBe('updated');
    expect(push).toHaveBeenCalledWith(
      'cal1',
      expect.objectContaining({ uid: 'remote', etag: '"old"' }),
    );
  });

  it('удаляет внешний объект при мягком удалении события', async () => {
    const { service, remove, push } = build({
      event: baseEvent({
        external_id: 'remote',
        external_etag: '"old"',
        deleted_at: new Date(),
      }),
    });

    const outcome = await service.pushEvent(
      '11111111-1111-1111-1111-111111111111',
    );

    expect(outcome).toBe('deleted');
    expect(remove).toHaveBeenCalledWith('cal1', 'remote');
    expect(push).not.toHaveBeenCalled();
  });

  it('пропускает удаление локального события без external_id', async () => {
    const { service, remove } = build({
      event: baseEvent({ deleted_at: new Date() }),
    });

    const outcome = await service.pushEvent(
      '11111111-1111-1111-1111-111111111111',
    );

    expect(outcome).toBe('skipped');
    expect(remove).not.toHaveBeenCalled();
  });

  it('при конфликте создаёт SyncConflict и ставит статус conflict', async () => {
    const { service, prisma } = build({
      event: baseEvent({ external_id: 'remote', external_etag: '"old"' }),
      pushError: new SyncConflictError('412'),
    });

    const outcome = await service.pushEvent(
      '11111111-1111-1111-1111-111111111111',
    );

    expect(outcome).toBe('conflict');
    expect(prisma.syncConflict.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ event_id: '11111111-1111-1111-1111-111111111111' }),
      }),
    );
    expect(prisma.event.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { sync_status: 'conflict' } }),
    );
  });

  it('не плодит дубликаты конфликта, если открытый уже есть', async () => {
    const { service, prisma } = build({
      event: baseEvent({ external_id: 'remote', external_etag: '"old"' }),
      pushError: new SyncConflictError('412'),
      openConflict: { id: 'conf1' },
    });

    await service.pushEvent('11111111-1111-1111-1111-111111111111');

    expect(prisma.syncConflict.create).not.toHaveBeenCalled();
  });

  it('транзиентную ошибку пробрасывает (событие остаётся pending для retry)', async () => {
    const { service, prisma } = build({ pushError: new Error('сеть') });

    await expect(
      service.pushEvent('11111111-1111-1111-1111-111111111111'),
    ).rejects.toThrow('сеть');
    expect(prisma.event.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { sync_status: 'pending' } }),
    );
  });
});
