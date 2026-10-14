import { NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service';

describe('EventsService', () => {
  let prisma: {
    event: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
    source: { findFirst: jest.Mock };
    eventHistory: { create: jest.Mock; findMany: jest.Mock };
  };
  let spaces: { ensureMember: jest.Mock };
  let service: EventsService;

  const baseEvent = {
    id: 'e1',
    source_id: 'src1',
    creator_id: 'u1',
    title: 'Созвон',
    description: null,
    start_at: new Date('2026-01-01T10:00:00.000Z'),
    end_at: new Date('2026-01-01T11:00:00.000Z'),
    all_day: false,
    timezone: 'UTC',
    location: null,
    rrule: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    external_id: null,
    external_provider: null,
    sync_status: 'IDLE',
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
        update: jest.fn(),
      },
      source: { findFirst: jest.fn() },
      eventHistory: { create: jest.fn(), findMany: jest.fn() },
    };
    spaces = { ensureMember: jest.fn() };
    service = new EventsService(prisma as never, spaces as never);
  });

  it('создаёт событие и пишет историю CREATED', async () => {
    prisma.source.findFirst.mockResolvedValue({ id: 'src1', space_id: 'sp1' });
    spaces.ensureMember.mockResolvedValue({});
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

  it('update пишет историю UPDATED со старыми и новыми данными', async () => {
    prisma.source.findFirst.mockResolvedValue({ id: 'src1', space_id: 'sp1' });
    spaces.ensureMember.mockResolvedValue({});
    prisma.event.findFirst.mockResolvedValue(baseEvent);
    prisma.event.update.mockResolvedValue({ ...baseEvent, title: 'Правка' });

    await service.update('u1', 'e1', { title: 'Правка' });

    const call = prisma.eventHistory.create.mock.calls[0][0];
    expect(call.data.action).toBe('UPDATED');
    expect(call.data.old_data.title).toBe('Созвон');
    expect(call.data.new_data.title).toBe('Правка');
  });

  it('remove выполняет мягкое удаление и пишет историю DELETED', async () => {
    prisma.source.findFirst.mockResolvedValue({ id: 'src1', space_id: 'sp1' });
    spaces.ensureMember.mockResolvedValue({});
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
});
