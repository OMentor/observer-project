import { RealtimeService } from './realtime.service';
import { RealtimeEvents } from './realtime.events';

describe('RealtimeService', () => {
  let prisma: {
    space: { findFirst: jest.Mock };
    spaceMember: { findMany: jest.Mock };
  };
  let gateway: {
    emitToUser: jest.Mock;
    emitToSpace: jest.Mock;
    removeUserFromSpace: jest.Mock;
  };
  let bridge: { publish: jest.Mock };
  let service: RealtimeService;

  const event = {
    id: 'e1',
    source_id: 'src1',
    creator_id: 'owner',
    title: 'Созвон',
    description: 'секрет',
    location: 'Офис',
    start_at: new Date('2026-01-01T10:00:00.000Z'),
    end_at: new Date('2026-01-01T11:00:00.000Z'),
    all_day: false,
    timezone: 'UTC',
    rrule: null,
  };

  beforeEach(() => {
    prisma = {
      space: { findFirst: jest.fn() },
      spaceMember: { findMany: jest.fn() },
    };
    gateway = {
      emitToUser: jest.fn(),
      emitToSpace: jest.fn(),
      removeUserFromSpace: jest.fn().mockResolvedValue(undefined),
    };
    bridge = { publish: jest.fn().mockResolvedValue(undefined) };
    service = new RealtimeService(
      prisma as never,
      gateway as never,
      bridge as never,
    );
  });

  it('eventChanged рассылает маскированный payload по пресетам', async () => {
    prisma.space.findFirst.mockResolvedValue({ owner_id: 'owner' });
    prisma.spaceMember.findMany.mockResolvedValue([
      { user_id: 'busy', preset: 'BUSY' },
      { user_id: 'own', preset: 'OWN' },
      { user_id: 'reader', preset: 'READ' },
    ]);

    await service.eventChanged(RealtimeEvents.eventCreated, event as never, {
      space_id: 'sp1',
      visibility: 'SHARED',
    }, 'owner');

    const calls = new Map(
      gateway.emitToUser.mock.calls.map((call) => [call[0], call[2]]),
    );
    expect(calls.get('owner')!.event.busy).toBe(false);
    expect(calls.get('owner')!.event.title).toBe('Созвон');
    expect(calls.get('owner')!.actor_id).toBe('owner');
    expect(calls.get('busy')!.event.busy).toBe(true);
    expect(calls.get('busy')!.event.title).toBe('Занято');
    expect(calls.get('own')!.event.busy).toBe(true);
    expect(calls.get('reader')!.event.busy).toBe(false);
    expect(calls.get('reader')!.event.title).toBe('Созвон');
  });

  it('eventChanged не отправляет событие из PRIVATE-источника не-FULL', async () => {
    prisma.space.findFirst.mockResolvedValue({ owner_id: 'owner' });
    prisma.spaceMember.findMany.mockResolvedValue([
      { user_id: 'busy', preset: 'BUSY' },
    ]);

    await service.eventChanged(RealtimeEvents.eventUpdated, event as never, {
      space_id: 'sp1',
      visibility: 'PRIVATE',
    }, 'owner');

    const recipients = gateway.emitToUser.mock.calls.map((call) => call[0]);
    expect(recipients).toEqual(['owner']);
  });

  it('memberKicked исключает пользователя из комнаты и уведомляет', async () => {
    await service.memberKicked('sp1', 'u2', 'owner');

    expect(gateway.removeUserFromSpace).toHaveBeenCalledWith('u2', 'sp1');
    expect(gateway.emitToUser).toHaveBeenCalledWith(
      'u2',
      RealtimeEvents.memberKicked,
      { space_id: 'sp1', user_id: 'u2', actor_id: 'owner' },
    );
    expect(gateway.emitToSpace).toHaveBeenCalledWith(
      'sp1',
      RealtimeEvents.memberKicked,
      { space_id: 'sp1', user_id: 'u2', actor_id: 'owner' },
    );
  });

  it('tokenActivated уведомляет комнату пространства', () => {
    service.tokenActivated('sp1', 'u2', 'OWN');

    expect(gateway.emitToSpace).toHaveBeenCalledWith(
      'sp1',
      RealtimeEvents.tokenActivated,
      { space_id: 'sp1', user_id: 'u2', preset: 'OWN', actor_id: 'u2' },
    );
  });

  it('conflictCreated публикует событие в Redis-шину', async () => {
    await service.conflictCreated('u1', {
      conflict_id: 'conf1',
      event_id: 'ev1',
      title: 'Созвон',
    });

    expect(bridge.publish).toHaveBeenCalledWith('u1', RealtimeEvents.syncConflict, {
      conflict_id: 'conf1',
      event_id: 'ev1',
      title: 'Созвон',
    });
  });
});
