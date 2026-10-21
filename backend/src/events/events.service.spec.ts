import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service';

describe('EventsService', () => {
  let prisma: {
    event: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
    };
    source: { findFirst: jest.Mock };
    space: { findMany: jest.Mock };
    eventHistory: { create: jest.Mock; findMany: jest.Mock };
    sourceExternalMap: { findFirst: jest.Mock };
    $transaction: jest.Mock;
  };
  let spaces: { getAccess: jest.Mock; ensureMember: jest.Mock };
  let realtime: { eventChanged: jest.Mock };
  let syncQueue: { enqueuePush: jest.Mock };
  let service: EventsService;

  const baseEvent = {
    id: 'e1',
    source_id: 'src1',
    creator_id: 'u1',
    title: 'Созвон',
    description: 'секрет',
    start_at: new Date('2026-01-01T10:00:00.000Z'),
    end_at: new Date('2026-01-01T11:00:00.000Z'),
    all_day: false,
    timezone: 'UTC',
    location: 'Офис',
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
  };

  beforeEach(() => {
    prisma = {
      event: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      source: { findFirst: jest.fn() },
      space: { findMany: jest.fn() },
      eventHistory: { create: jest.fn(), findMany: jest.fn() },
      sourceExternalMap: { findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    };
    spaces = { getAccess: jest.fn(), ensureMember: jest.fn() };
    realtime = { eventChanged: jest.fn().mockResolvedValue(undefined) };
    syncQueue = { enqueuePush: jest.fn().mockResolvedValue(undefined) };
    service = new EventsService(
      prisma as never,
      spaces as never,
      realtime as never,
      syncQueue as never,
    );
  });

  it('создаёт событие и пишет историю CREATED', async () => {
    prisma.source.findFirst.mockResolvedValue({ id: 'src1', space_id: 'sp1' });
    spaces.getAccess.mockResolvedValue({ isOwner: true, preset: 'FULL' });
    prisma.event.create.mockResolvedValue(baseEvent);

    await service.create('u1', 'src1', {
      title: 'Созвон',
      start_at: new Date('2026-01-01T10:00:00.000Z'),
      end_at: new Date('2026-01-01T11:00:00.000Z'),
    });

    expect(prisma.eventHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ event_id: 'e1', action: 'CREATED' }),
      }),
    );
  });

  it('ставит push-задачу, если источник связан с внешним календарём', async () => {
    prisma.source.findFirst.mockResolvedValue({ id: 'src1', space_id: 'sp1' });
    spaces.getAccess.mockResolvedValue({ isOwner: true, preset: 'FULL' });
    prisma.event.create.mockResolvedValue(baseEvent);
    prisma.sourceExternalMap.findFirst.mockResolvedValue({ id: 'map1' });

    await service.create('u1', 'src1', {
      title: 'Созвон',
      start_at: new Date('2026-01-01T10:00:00.000Z'),
      end_at: new Date('2026-01-01T11:00:00.000Z'),
    });

    expect(syncQueue.enqueuePush).toHaveBeenCalledWith('e1');
  });

  it('не ставит push-задачу для источника без внешней связи', async () => {
    prisma.source.findFirst.mockResolvedValue({ id: 'src1', space_id: 'sp1' });
    spaces.getAccess.mockResolvedValue({ isOwner: true, preset: 'FULL' });
    prisma.event.create.mockResolvedValue(baseEvent);

    await service.create('u1', 'src1', {
      title: 'Созвон',
      start_at: new Date('2026-01-01T10:00:00.000Z'),
      end_at: new Date('2026-01-01T11:00:00.000Z'),
    });

    expect(syncQueue.enqueuePush).not.toHaveBeenCalled();
  });

  it('update пишет историю UPDATED со старыми и новыми данными', async () => {    prisma.source.findFirst.mockResolvedValue({ space_id: 'sp1' });
    spaces.getAccess.mockResolvedValue({ isOwner: true, preset: 'FULL' });
    prisma.event.findFirst.mockResolvedValue(baseEvent);
    prisma.event.update.mockResolvedValue({ ...baseEvent, title: 'Правка' });

    await service.update('u1', 'e1', { title: 'Правка' });

    const call = prisma.eventHistory.create.mock.calls[0][0];
    expect(call.data.action).toBe('UPDATED');
    expect(call.data.old_data.title).toBe('Созвон');
    expect(call.data.new_data.title).toBe('Правка');
  });

  it('remove выполняет мягкое удаление и пишет историю DELETED', async () => {
    prisma.source.findFirst.mockResolvedValue({ space_id: 'sp1' });
    spaces.getAccess.mockResolvedValue({ isOwner: true, preset: 'FULL' });
    prisma.event.findFirst.mockResolvedValue(baseEvent);
    prisma.event.update.mockResolvedValue({});

    await service.remove('u1', 'e1');

    expect(prisma.event.update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { deleted_at: expect.any(Date) },
    });
    expect(prisma.eventHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'DELETED' }),
      }),
    );
  });

  it('findOne бросает NotFoundException для несуществующего события', async () => {
    prisma.event.findFirst.mockResolvedValue(null);

    await expect(service.findOne('u1', 'e1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('BUSY маскирует детали события в списке', async () => {
    prisma.source.findFirst.mockResolvedValue({ id: 'src1', space_id: 'sp1' });
    spaces.getAccess.mockResolvedValue({ isOwner: false, preset: 'BUSY' });
    prisma.event.findMany.mockResolvedValue([baseEvent]);

    const result = await service.findAll('u1', 'src1', {});

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Занято');
    expect(result[0].description).toBeNull();
    expect(result[0].location).toBeNull();
    expect(result[0].busy).toBe(true);
  });

  it('OWN видит чужие события как «Занято», свои — полностью', async () => {
    prisma.source.findFirst.mockResolvedValue({ id: 'src1', space_id: 'sp1' });
    spaces.getAccess.mockResolvedValue({ isOwner: false, preset: 'OWN' });
    prisma.event.findMany.mockResolvedValue([
      baseEvent,
      { ...baseEvent, id: 'e2', creator_id: 'other' },
    ]);

    const result = await service.findAll('u1', 'src1', {});

    expect(result[0].title).toBe('Созвон');
    expect(result[0].busy).toBe(false);
    expect(result[1].title).toBe('Занято');
    expect(result[1].busy).toBe(true);
  });

  it('OWN запрещает править чужое событие', async () => {
    prisma.event.findFirst.mockResolvedValue({
      ...baseEvent,
      creator_id: 'other',
    });
    prisma.source.findFirst.mockResolvedValue({ space_id: 'sp1' });
    spaces.getAccess.mockResolvedValue({ isOwner: false, preset: 'OWN' });

    await expect(
      service.update('u1', 'e1', { title: 'Правка' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('READ запрещает изменение событий', async () => {
    prisma.source.findFirst.mockResolvedValue({ id: 'src1', space_id: 'sp1' });
    spaces.getAccess.mockResolvedValue({ isOwner: false, preset: 'READ' });

    await expect(
      service.create('u1', 'src1', {
        title: 'Созвон',
        start_at: new Date('2026-01-01T10:00:00.000Z'),
        end_at: new Date('2026-01-01T11:00:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('history недоступна для пресета BUSY', async () => {
    prisma.event.findFirst.mockResolvedValue(baseEvent);
    prisma.source.findFirst.mockResolvedValue({ space_id: 'sp1' });
    spaces.getAccess.mockResolvedValue({ isOwner: false, preset: 'BUSY' });

    await expect(service.history('u1', 'e1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('findAllAcross отдаёт события с маскировкой и пагинацией', async () => {
    prisma.space.findMany.mockResolvedValue([
      {
        id: 'sp1',
        owner_id: 'u1',
        sources: [{ id: 'src1', visibility: 'SHARED' }],
        members: [],
      },
      {
        id: 'sp2',
        owner_id: 'owner2',
        sources: [{ id: 'src2', visibility: 'SHARED' }],
        members: [{ preset: 'BUSY' }],
      },
    ]);
    prisma.event.count.mockResolvedValue(2);
    prisma.event.findMany.mockResolvedValue([
      baseEvent,
      { ...baseEvent, id: 'e2', source_id: 'src2', creator_id: 'other' },
    ]);

    const result = await service.findAllAcross('u1', {
      page: 1,
      pageSize: 50,
    });

    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.items[0].busy).toBe(false);
    expect(result.items[0].title).toBe('Созвон');
    expect(result.items[1].busy).toBe(true);
    expect(result.items[1].title).toBe('Занято');
  });

  it('findAllAcross скрывает приватные источники от не-FULL', async () => {
    prisma.space.findMany.mockResolvedValue([
      {
        id: 'sp2',
        owner_id: 'owner2',
        sources: [
          { id: 'srcShared', visibility: 'SHARED' },
          { id: 'srcPrivate', visibility: 'PRIVATE' },
        ],
        members: [{ preset: 'READ' }],
      },
    ]);
    prisma.event.count.mockResolvedValue(0);
    prisma.event.findMany.mockResolvedValue([]);

    await service.findAllAcross('u1', { page: 1, pageSize: 50 });

    const where = prisma.event.findMany.mock.calls[0][0].where;
    expect(where.source_id.in).toEqual(['srcShared']);
  });

  it('findAll отбирает события по пересечению с полуоткрытым диапазоном', async () => {
    prisma.source.findFirst.mockResolvedValue({ id: 'src1', space_id: 'sp1' });
    spaces.getAccess.mockResolvedValue({ isOwner: true, preset: 'FULL' });
    prisma.event.findMany.mockResolvedValue([]);
    const from = new Date('2026-01-10T00:00:00.000Z');
    const to = new Date('2026-01-11T00:00:00.000Z');

    await service.findAll('u1', 'src1', { from, to });

    const where = prisma.event.findMany.mock.calls[0][0].where;
    expect(where.AND).toEqual([
      {
        OR: [
          { end_at: { gt: from } },
          { start_at: { equals: from } },
        ],
      },
      { start_at: { lt: to } },
    ]);
  });

  it('findAllAcross использует тот же фильтр пересечения', async () => {
    prisma.space.findMany.mockResolvedValue([
      {
        id: 'sp1',
        owner_id: 'u1',
        sources: [{ id: 'src1', visibility: 'SHARED' }],
        members: [],
      },
    ]);
    prisma.event.count.mockResolvedValue(0);
    prisma.event.findMany.mockResolvedValue([]);
    const from = new Date('2026-01-10T00:00:00.000Z');
    const to = new Date('2026-01-11T00:00:00.000Z');

    await service.findAllAcross('u1', { from, to, page: 1, pageSize: 50 });

    const where = prisma.event.findMany.mock.calls[0][0].where;
    expect(where.AND).toEqual([
      {
        OR: [
          { end_at: { gt: from } },
          { start_at: { equals: from } },
        ],
      },
      { start_at: { lt: to } },
    ]);
  });

  it('findAllAcross запрещает недоступное пространство', async () => {
    prisma.space.findMany.mockResolvedValue([]);

    await expect(
      service.findAllAcross('u1', {
        space_id: 'spX',
        page: 1,
        pageSize: 50,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('findAllAcross с явным источником фильтрует по нему', async () => {
    prisma.space.findMany.mockResolvedValue([
      {
        id: 'sp1',
        owner_id: 'u1',
        sources: [
          { id: 'src1', visibility: 'SHARED' },
          { id: 'src2', visibility: 'SHARED' },
        ],
        members: [],
      },
    ]);
    prisma.event.count.mockResolvedValue(1);
    prisma.event.findMany.mockResolvedValue([baseEvent]);

    await service.findAllAcross('u1', {
      source_id: 'src2',
      page: 2,
      pageSize: 10,
    });

    const args = prisma.event.findMany.mock.calls[0][0];
    expect(args.where.source_id).toEqual({ in: ['src2'] });
    expect(args.skip).toBe(10);
    expect(args.take).toBe(10);
  });
});
