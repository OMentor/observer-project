import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type FunnelStepKey =
  | 'signup'
  | 'space_created'
  | 'token_created'
  | 'token_activated'
  | 'event_created';

export interface FunnelStep {
  key: FunnelStepKey;
  label: string;
  count: number;
}

export interface FunnelReport {
  steps: FunnelStep[];
  generated_at: string;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async funnel(): Promise<FunnelReport> {
    const [signups, spaces, tokens, activated, events] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.space.groupBy({
        by: ['owner_id'],
        where: { deleted_at: null },
      }),
      this.prisma.token.groupBy({ by: ['created_by'] }),
      this.prisma.token.groupBy({
        by: ['used_by'],
        where: { used_by: { not: null } },
      }),
      this.prisma.event.groupBy({
        by: ['creator_id'],
        where: { deleted_at: null },
      }),
    ]);

    return {
      generated_at: new Date().toISOString(),
      steps: [
        { key: 'signup', label: 'Регистрация', count: signups },
        { key: 'space_created', label: 'Пространство', count: spaces.length },
        { key: 'token_created', label: 'Токен создан', count: tokens.length },
        {
          key: 'token_activated',
          label: 'Токен активирован',
          count: activated.length,
        },
        { key: 'event_created', label: 'Событие создано', count: events.length },
      ],
    };
  }
}
