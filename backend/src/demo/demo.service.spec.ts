import { DemoService, startOfCurrentQuarter } from './demo.service';

describe('DemoService', () => {
  let prisma: {
    event: { count: jest.Mock; createMany: jest.Mock };
    user: { findUnique: jest.Mock };
    space: { create: jest.Mock };
    source: { create: jest.Mock };
  };
  let service: DemoService;

  beforeEach(() => {
    prisma = {
      event: { count: jest.fn(), createMany: jest.fn() },
      user: { findUnique: jest.fn() },
      space: { create: jest.fn() },
      source: { create: jest.fn() },
    };
    service = new DemoService(prisma as never);
  });

  it('наполняет примером пространства, источники и события', async () => {
    prisma.event.count.mockResolvedValue(0);
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', timezone: 'Europe/Moscow' });
    prisma.space.create
      .mockResolvedValueOnce({ id: 'sp-work' })
      .mockResolvedValueOnce({ id: 'sp-personal' });
    prisma.source.create
      .mockResolvedValueOnce({ id: 'src-team' })
      .mockResolvedValueOnce({ id: 'src-projects' })
      .mockResolvedValueOnce({ id: 'src-personal' });
    prisma.event.createMany.mockResolvedValue({ count: 15 });

    const result = await service.seed('u1');

    expect(result.created).toBe(true);
    expect(result.spaces).toBe(2);
    expect(result.sources).toBe(3);
    expect(result.events).toBe(15);
    expect(prisma.space.create).toHaveBeenCalledTimes(2);
    expect(prisma.source.create).toHaveBeenCalledTimes(3);
    expect(prisma.event.createMany).toHaveBeenCalledTimes(1);
    const created = prisma.event.createMany.mock.calls[0][0].data;
    expect(created).toHaveLength(15);
    expect(created[0].timezone).toBe('Europe/Moscow');
    expect(created.every((e: { source_id: string }) =>
      ['src-team', 'src-projects', 'src-personal'].includes(e.source_id),
    )).toBe(true);
  });

  it('не создаёт дубликаты, если у пользователя уже есть события', async () => {
    prisma.event.count.mockResolvedValue(4);

    const result = await service.seed('u1');

    expect(result.created).toBe(false);
    expect(result.reason).toBe('has-events');
    expect(prisma.space.create).not.toHaveBeenCalled();
    expect(prisma.source.create).not.toHaveBeenCalled();
    expect(prisma.event.createMany).not.toHaveBeenCalled();
  });

  it('использует UTC, если таймзона пользователя неизвестна', async () => {
    prisma.event.count.mockResolvedValue(0);
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.space.create
      .mockResolvedValueOnce({ id: 'sp-work' })
      .mockResolvedValueOnce({ id: 'sp-personal' });
    prisma.source.create
      .mockResolvedValueOnce({ id: 'src-team' })
      .mockResolvedValueOnce({ id: 'src-projects' })
      .mockResolvedValueOnce({ id: 'src-personal' });
    prisma.event.createMany.mockResolvedValue({ count: 15 });

    await service.seed('u1');

    const created = prisma.event.createMany.mock.calls[0][0].data;
    expect(created[0].timezone).toBe('UTC');
  });

  it('возвращает начало текущего квартала', () => {
    expect(startOfCurrentQuarter(new Date(2026, 0, 15))).toEqual(new Date(2026, 0, 1));
    expect(startOfCurrentQuarter(new Date(2026, 4, 2))).toEqual(new Date(2026, 3, 1));
    expect(startOfCurrentQuarter(new Date(2026, 11, 31))).toEqual(new Date(2026, 9, 1));
  });
});
