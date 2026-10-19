import { Injectable, NotFoundException } from '@nestjs/common';
import { Event, ExternalProvider } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeService } from '../../realtime/realtime.service';
import { RealtimeEvents } from '../../realtime/realtime.events';
import { parseIcalEvent } from '../ical/ical-parser';
import { ProviderFactory } from '../providers/provider.factory';
import { PullResult } from '../providers/sync-provider.interface';

export interface PullStats {
  created: number;
  updated: number;
  deleted: number;
  skipped: number;
}

/**
 * Применяет результат pull к локальной БД: создаёт/обновляет события по ETag,
 * помечает удалённые, рассылает realtime-уведомления.
 *
 * Pull полный: сравниваем набор внешних UID с локальными событиями источника
 * и помечаем отсутствующие как удалённые.
 */
@Injectable()
export class PullService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly factory: ProviderFactory,
    private readonly realtime: RealtimeService,
  ) {}

  async pullSourceMap(sourceMapId: string): Promise<PullStats> {
    const map = await this.prisma.sourceExternalMap.findUnique({
      where: { id: sourceMapId },
      include: {
        source: { select: { id: true, space_id: true, visibility: true } },
        external_connection: true,
      },
    });
    if (!map) {
      throw new NotFoundException('Связь источника с календарём не найдена');
    }

    const connection = map.external_connection;
    const provider = this.factory.create(connection);

    let result: PullResult;
    try {
      result = await provider.pull(map.external_calendar_id);
    } catch (error) {
      await this.prisma.externalConnection.update({
        where: { id: connection.id },
        data: {
          sync_status: 'error',
          last_error: (error as Error).message.slice(0, 500),
        },
      });
      throw error;
    }

    const stats = await this.applyResult(
      map.source,
      connection.user_id,
      connection.provider,
      result,
    );

    await this.prisma.externalConnection.update({
      where: { id: connection.id },
      data: {
        sync_status: 'active',
        last_error: null,
        last_sync_at: new Date(),
      },
    });

    return stats;
  }

  private async applyResult(
    source: { id: string; space_id: string; visibility: string },
    userId: string,
    providerValue: ExternalProvider,
    result: PullResult,
  ): Promise<PullStats> {
    const sourceRef = {
      space_id: source.space_id,
      visibility: source.visibility,
    };
    const stats: PullStats = { created: 0, updated: 0, deleted: 0, skipped: 0 };

    const existing = await this.prisma.event.findMany({
      where: { source_id: source.id, external_id: { not: null } },
    });
    const existingByUid = new Map(
      existing.map((event) => [event.external_id as string, event]),
    );
    const remoteUids = new Set(result.events.map((event) => event.uid));

    for (const remote of result.events) {
      const parsed = parseIcalEvent(remote.ical);
      if (!parsed) {
        stats.skipped += 1;
        continue;
      }
      const local = existingByUid.get(remote.uid);
      if (local) {
        // ETag совпадает и событие активно — изменений нет.
        if (local.external_etag === remote.etag && !local.deleted_at) {
          stats.skipped += 1;
          continue;
        }
        const event = await this.prisma.event.update({
          where: { id: local.id },
          data: {
            title: parsed.title,
            description: parsed.description,
            start_at: parsed.startAt,
            end_at: parsed.endAt,
            all_day: parsed.allDay,
            timezone: parsed.timezone,
            location: parsed.location,
            rrule: parsed.rrule,
            external_etag: remote.etag,
            external_provider: providerValue,
            sync_status: 'synced',
            last_synced_at: new Date(),
            deleted_at: null,
          },
        });
        stats.updated += 1;
        await this.realtime.eventChanged(
          RealtimeEvents.eventUpdated,
          event,
          sourceRef,
          userId,
        );
      } else {
        const event = await this.prisma.event.create({
          data: {
            source_id: source.id,
            creator_id: userId,
            title: parsed.title,
            description: parsed.description,
            start_at: parsed.startAt,
            end_at: parsed.endAt,
            all_day: parsed.allDay,
            timezone: parsed.timezone,
            location: parsed.location,
            rrule: parsed.rrule,
            external_id: remote.uid,
            external_provider: providerValue,
            external_etag: remote.etag,
            sync_status: 'synced',
            last_synced_at: new Date(),
          },
        });
        existingByUid.set(remote.uid, event);
        stats.created += 1;
        await this.realtime.eventChanged(
          RealtimeEvents.eventCreated,
          event,
          sourceRef,
          userId,
        );
      }
    }

    const toDelete: Event[] = existing.filter(
      (local) =>
        !local.deleted_at &&
        local.external_id !== null &&
        !remoteUids.has(local.external_id),
    );

    for (const local of toDelete) {
      const event = await this.prisma.event.update({
        where: { id: local.id },
        data: { deleted_at: new Date() },
      });
      stats.deleted += 1;
      await this.realtime.eventChanged(
        RealtimeEvents.eventDeleted,
        event,
        sourceRef,
        userId,
      );
    }

    return stats;
  }
}
