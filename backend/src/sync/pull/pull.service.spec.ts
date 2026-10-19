import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeService } from '../../realtime/realtime.service';
import { ProviderFactory } from '../providers/provider.factory';
import { PullService } from './pull.service';

function ics(uid: string, summary: string): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pletenie//Test//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    'DTSTAMP:20261015T090000Z',
    'DTSTART:20261020T100000Z',
    'DTEND:20261020T110000Z',
    `SUMMARY:${summary}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

const source = { id: 'src1', space_id: 'space1', visibility: 'SHARED' };
const connection = {
  id: 'conn1',
  user_id: 'user1',
  provider: 'yandex' as const,
  sync_token: null,
};
const map = {
  id: 'map1',
  external_calendar_id: 'cal1',
  source,
  external_connection: connection,
};

interface Harness {
  service: PullService;
  prisma: any;
  realtime: any;
  pull: jest.Mock;
}

function build(params: {
  pullResult?: unknown;
  pullError?: Error;
  existing?: unknown[];
  mapsCount?: number;
}): Harness {
  const pull = jest.fn();
  if (params.pullError) {
    pull.mockRejectedValue(params.pullError);
  } else {
    pull.mockResolvedValue(params.pullResult);
  }

  const prisma = {
    sourceExternalMap: {
      findUnique: jest.fn().mockResolvedValue(map),
      count: jest.fn().mockResolvedValue(params.mapsCount ?? 1),
    },
    event: {
      findMany: jest.fn().mockResolvedValue(params.existing ?? []),
      create: jest.fn((args: any) =>
        Promise.resolve({ id: `new-${args.data.external_id}`, ...args.data }),
      ),
      update: jest.fn((args: any) =>
        Promise.resolve({ id: args.where.id, ...args.data }),
      ),
    },
    externalConnection: {
      update: jest.fn().mockResolvedValue({}),
    },
  };
  const realtime = { eventChanged: jest.fn().mockResolvedValue(undefined) };
  const factory = { create: jest.fn().mockReturnValue({ pull }) };

  const service = new PullService(
    prisma as unknown as PrismaService,
    factory as unknown as ProviderFactory,
    realtime as unknown as RealtimeService,
  );
  return { service, prisma, realtime, pull };
}

describe('PullService', () => {
  it('создаёт события из полной выборки и обновляет статус подключения', async () => {
    const { service, prisma, realtime } = build({
      pullResult: {
        events: [
          { uid: 'a', etag: 'etag-a', ical: ics('a', 'A') },
          { uid: 'b', etag: 'etag-b', ical: ics('b', 'B') },
        ],
      },
    });

    const stats = await service.pullSourceMap('map1');

    expect(stats).toEqual({ created: 2, updated: 0, deleted: 0, skipped: 0 });
    expect(prisma.event.create).toHaveBeenCalledTimes(2);
    expect(prisma.event.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          source_id: 'src1',
          creator_id: 'user1',
          external_id: 'a',
          external_etag: 'etag-a',
          external_provider: 'yandex',
          sync_status: 'synced',
        }),
      }),
    );
    expect(realtime.eventChanged).toHaveBeenCalledTimes(2);
    expect(prisma.externalConnection.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ sync_status: 'active' }),
      }),
    );
  });

  it('обновляет событие при смене ETag и пропускает при совпадении', async () => {
    const existing = [
      {
        id: 'e1',
        external_id: 'a',
        external_etag: 'etag-a',
        deleted_at: null,
      },
      {
        id: 'e2',
        external_id: 'b',
        external_etag: 'etag-old',
        deleted_at: null,
      },
    ];
    const { service, prisma } = build({
      existing,
      pullResult: {
        events: [
          { uid: 'a', etag: 'etag-a', ical: ics('a', 'A') },
          { uid: 'b', etag: 'etag-b', ical: ics('b', 'B2') },
        ],
      },
    });

    const stats = await service.pullSourceMap('map1');

    expect(stats).toEqual({ created: 0, updated: 1, deleted: 0, skipped: 1 });
    expect(prisma.event.update).toHaveBeenCalledTimes(1);
    expect(prisma.event.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'e2' },
        data: expect.objectContaining({ external_etag: 'etag-b' }),
      }),
    );
  });

  it('помечает удалённые события при полной выборке', async () => {
    const existing = [
      { id: 'e1', external_id: 'a', external_etag: 'etag-a', deleted_at: null },
      {
        id: 'e2',
        external_id: 'gone',
        external_etag: 'etag-gone',
        deleted_at: null,
      },
    ];
    const { service, prisma } = build({
      existing,
      pullResult: {
        events: [{ uid: 'a', etag: 'etag-a', ical: ics('a', 'A') }],
      },
    });

    const stats = await service.pullSourceMap('map1');

    expect(stats.deleted).toBe(1);
    expect(prisma.event.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'e2' },
        data: expect.objectContaining({ deleted_at: expect.any(Date) }),
      }),
    );
  });

  it('не удаляет уже удалённые локальные события повторно', async () => {
    const existing = [
      {
        id: 'e1',
        external_id: 'a',
        external_etag: 'etag-a',
        deleted_at: null,
      },
      {
        id: 'e2',
        external_id: 'gone',
        external_etag: 'etag-gone',
        deleted_at: new Date('2026-10-01'),
      },
    ];
    const { service, prisma } = build({
      existing,
      pullResult: {
        events: [{ uid: 'a', etag: 'etag-a', ical: ics('a', 'A') }],
      },
    });

    const stats = await service.pullSourceMap('map1');

    expect(stats.deleted).toBe(0);
    expect(prisma.event.update).not.toHaveBeenCalled();
  });

  it('переводит подключение в статус error и пробрасывает ошибку', async () => {
    const { service, prisma } = build({ pullError: new Error('403 Forbidden') });

    await expect(service.pullSourceMap('map1')).rejects.toThrow('403 Forbidden');
    expect(prisma.externalConnection.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sync_status: 'error',
          last_error: '403 Forbidden',
        }),
      }),
    );
  });

  it('бросает NotFound для неизвестной связи', async () => {
    const { service, prisma } = build({ pullResult: null });
    prisma.sourceExternalMap.findUnique.mockResolvedValue(null);

    await expect(service.pullSourceMap('missing')).rejects.toThrow(
      'Связь источника с календарём не найдена',
    );
  });
});
