import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let prisma: {
    user: { count: jest.Mock };
    space: { groupBy: jest.Mock };
    token: { groupBy: jest.Mock };
    event: { groupBy: jest.Mock };
  };
  let service: AnalyticsService;

  beforeEach(() => {
    prisma = {
      user: { count: jest.fn() },
      space: { groupBy: jest.fn() },
      token: { groupBy: jest.fn() },
      event: { groupBy: jest.fn() },
    };
    service = new AnalyticsService(prisma as never);
  });

  it('считает ступени воронки по уникальным пользователям', async () => {
    prisma.user.count.mockResolvedValue(10);
    prisma.space.groupBy.mockResolvedValue([
      { owner_id: 'a' },
      { owner_id: 'b' },
    ]);
    prisma.token.groupBy
      .mockResolvedValueOnce([{ created_by: 'a' }])
      .mockResolvedValueOnce([{ used_by: 'b' }]);
    prisma.event.groupBy.mockResolvedValue([{ creator_id: 'b' }]);

    const report = await service.funnel();

    expect(report.steps.map((step) => step.key)).toEqual([
      'signup',
      'space_created',
      'token_created',
      'token_activated',
      'event_created',
    ]);
    expect(report.steps.map((step) => step.count)).toEqual([10, 2, 1, 1, 1]);
    expect(Number.isNaN(Date.parse(report.generated_at))).toBe(false);
  });

  it('фильтрует удалённое и неактивированные токены', async () => {
    prisma.user.count.mockResolvedValue(0);
    prisma.space.groupBy.mockResolvedValue([]);
    prisma.token.groupBy.mockResolvedValue([]);
    prisma.event.groupBy.mockResolvedValue([]);

    await service.funnel();

    expect(prisma.space.groupBy).toHaveBeenCalledWith({
      by: ['owner_id'],
      where: { deleted_at: null },
    });
    expect(prisma.token.groupBy).toHaveBeenCalledWith({ by: ['created_by'] });
    expect(prisma.token.groupBy).toHaveBeenCalledWith({
      by: ['used_by'],
      where: { used_by: { not: null } },
    });
    expect(prisma.event.groupBy).toHaveBeenCalledWith({
      by: ['creator_id'],
      where: { deleted_at: null },
    });
  });
});
