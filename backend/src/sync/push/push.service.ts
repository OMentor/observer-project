import { Injectable } from '@nestjs/common';
import { Event, ExternalConnection, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeService } from '../../realtime/realtime.service';
import { parseIcalEvent } from '../ical/ical-parser';
import { serializeEvent } from '../ical/ical-serializer';
import { ProviderFactory } from '../providers/provider.factory';
import {
  RemoteEvent,
  SyncProvider,
} from '../providers/sync-provider.interface';
import { SyncConflictError } from '../sync-errors';

/** Итог обработки одного события при push во внешний календарь. */
export type PushOutcome =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'skipped'
  | 'conflict';

/** Снимок полей события для `SyncConflict.local_data`. */
function toLocalData(event: Event): Prisma.InputJsonObject {
  return {
    title: event.title,
    description: event.description,
    start_at: event.start_at.toISOString(),
    end_at: event.end_at.toISOString(),
    all_day: event.all_day,
    timezone: event.timezone,
    location: event.location,
    rrule: event.rrule,
  };
}

/**
 * Односторонняя запись локальных изменений во внешний календарь.
 *
 * Вызывается воркером из очереди `sync` (событие `pushEventId`). Действует
 * только если источник связан с внешним календарём и направление допускает
 * запись (`both` или `out`).
 */
@Injectable()
export class PushService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly factory: ProviderFactory,
    private readonly realtime: RealtimeService,
  ) {}

  async pushEvent(eventId: string): Promise<PushOutcome> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      return 'skipped';
    }

    const map = await this.prisma.sourceExternalMap.findFirst({
      where: { source_id: event.source_id },
      include: { external_connection: true },
    });
    if (!map || map.sync_status === 'orphaned' || map.sync_direction === 'in') {
      return 'skipped';
    }

    const connection = map.external_connection;

    // Удаление: убираем внешний объект, если он был создан.
    if (event.deleted_at) {
      if (event.external_id) {
        const provider = this.factory.create(connection);
        await provider.delete(map.external_calendar_id, event.external_id);
        return 'deleted';
      }
      return 'skipped';
    }

    const isUpdate = event.external_id !== null;
    const remote: RemoteEvent = {
      uid: event.external_id ?? event.id,
      etag: isUpdate ? event.external_etag : null,
      ical: serializeEvent(event),
    };

    await this.prisma.event.update({
      where: { id: eventId },
      data: { sync_status: 'pending' },
    });

    const provider = this.factory.create(connection);
    try {
      const result = await provider.push(map.external_calendar_id, remote);
      await this.prisma.event.update({
        where: { id: eventId },
        data: {
          external_id: result.uid,
          external_etag: result.etag,
          external_provider: connection.provider,
          sync_status: 'synced',
          last_synced_at: new Date(),
        },
      });
      return isUpdate ? 'updated' : 'created';
    } catch (error) {
      if (error instanceof SyncConflictError) {
        const conflict = await this.recordConflict(
          event,
          connection,
          provider,
          map.external_calendar_id,
        );
        await this.prisma.event.update({
          where: { id: eventId },
          data: { sync_status: 'conflict' },
        });
        if (conflict) {
          await this.realtime.conflictCreated(connection.user_id, {
            conflict_id: conflict.id,
            event_id: event.id,
            title: event.title,
          });
        }
        return 'conflict';
      }
      // Транзиентная ошибка — оставляем `pending` и пробрасываем для retry.
      throw error;
    }
  }

  /**
   * Фиксирует конфликт один раз (не плодит дубликаты при повторах).
   *
   * Снимок внешней версии — best-effort: если прочитать объект не удалось,
   * `external_data` остаётся пустым (разрешить его нельзя), а `external_etag`
   * берётся из последней известной локальной версии. Возвращает созданную
   * запись либо `null`, если открытый конфликт уже есть (уведомление не шлём).
   */
  private async recordConflict(
    event: Event,
    connection: ExternalConnection,
    provider: SyncProvider,
    calendarId: string,
  ): Promise<{ id: string } | null> {
    const existing = await this.prisma.syncConflict.findFirst({
      where: { event_id: event.id, resolution: null },
    });
    if (existing) {
      return null;
    }
    const remote = await this.fetchRemoteSnapshot(provider, calendarId, event);
    return this.prisma.syncConflict.create({
      data: {
        event_id: event.id,
        external_connection_id: connection.id,
        local_data: toLocalData(event),
        external_data: remote.data,
        external_etag: remote.etag ?? event.external_etag,
      },
    });
  }

  /** Читает актуальную внешнюю версию события для снимка конфликта. */
  private async fetchRemoteSnapshot(
    provider: SyncProvider,
    calendarId: string,
    event: Event,
  ): Promise<{ data: Prisma.InputJsonObject; etag: string | null }> {
    const uid = event.external_id ?? event.id;
    try {
      const { events } = await provider.pull(calendarId);
      const match = events.find((item) => item.uid === uid);
      if (!match) {
        return { data: {}, etag: null };
      }
      const parsed = parseIcalEvent(match.ical);
      if (!parsed) {
        return { data: {}, etag: match.etag };
      }
      return {
        data: {
          title: parsed.title,
          description: parsed.description,
          start_at: parsed.startAt.toISOString(),
          end_at: parsed.endAt.toISOString(),
          all_day: parsed.allDay,
          timezone: parsed.timezone,
          location: parsed.location,
          rrule: parsed.rrule,
        },
        etag: match.etag,
      };
    } catch {
      return { data: {}, etag: null };
    }
  }
}
