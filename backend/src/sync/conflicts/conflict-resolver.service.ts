import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ConflictResolution,
  Event,
  ExternalConnection,
  SyncConflict,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { serializeEvent } from '../ical/ical-serializer';
import { ProviderFactory } from '../providers/provider.factory';
import { RemoteEvent } from '../providers/sync-provider.interface';
import {
  ConflictFields,
  conflictSnapshotSchema,
  EventDataInput,
  toEventData,
} from './conflict-data';
import { ListConflictsDto } from './dto/list-conflicts.query';
import { MergedDataDto, ResolveConflictDto } from './dto/resolve-conflict.dto';

interface OwnedConflict {
  conflict: SyncConflict & { event: Event };
  connection: ExternalConnection;
}

interface CommitInput {
  data: EventDataInput;
  externalId: string | null;
  etag: string | null;
  resolution: ConflictResolution;
}

/**
 * Разрешение конфликтов синхронизации (Фаза 4).
 *
 * Три ветки:
 * - `local` — «наша версия»: безусловная перезапись внешнего объекта
 *   (`forcePush`), событию проставляется новый ETag.
 * - `external` — «внешняя версия»: применяем снимок внешних данных к событию и
 *   принимаем `external_etag` конфликта; наружу ничего не пишем.
 * - `merged` — «объединение»: частичное наложение правок на локальную версию,
 *   затем `forcePush` (как в `local`).
 *
 * Записи `Event` и `SyncConflict` фиксируются одной транзакцией. Сетевой вызов
 * `forcePush` выполняется вне транзакции: при его ошибке конфликт остаётся
 * неразрешённым (503), а событие не изменяется.
 */
@Injectable()
export class ConflictResolverService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly factory: ProviderFactory,
  ) {}

  /** Список неразрешённых конфликтов подключений пользователя. */
  async list(userId: string, query: ListConflictsDto) {
    const connections = await this.prisma.externalConnection.findMany({
      where: { user_id: userId },
      select: { id: true },
    });
    const connectionIds = connections.map((connection) => connection.id);
    if (connectionIds.length === 0) {
      return { items: [], limit: query.limit, offset: query.offset };
    }

    const conflicts = await this.prisma.syncConflict.findMany({
      where: {
        resolution: null,
        external_connection_id: query.connection_id
          ? query.connection_id
          : { in: connectionIds },
        ...(query.event_id ? { event_id: query.event_id } : {}),
        ...(query.space_id
          ? { event: { source: { space_id: query.space_id } } }
          : {}),
      },
      include: {
        event: { select: { id: true, title: true, source_id: true } },
      },
      orderBy: { created_at: 'desc' },
      take: query.limit,
      skip: query.offset,
    });

    return {
      items: conflicts.map((conflict) => this.toView(conflict)),
      limit: query.limit,
      offset: query.offset,
    };
  }

  /** Один конфликт с полными снимками. */
  async get(userId: string, id: string) {
    const { conflict } = await this.findOwned(userId, id);
    return this.toView(conflict);
  }

  /** Разрешает конфликт и возвращает обновлённое событие. */
  async resolve(
    userId: string,
    id: string,
    payload: ResolveConflictDto,
  ): Promise<Event> {
    const { conflict, connection } = await this.findOwned(userId, id);
    if (conflict.resolved_at) {
      throw new ConflictException('Конфликт уже разрешён');
    }
    const event = conflict.event;
    if (event.deleted_at) {
      throw new ConflictException('Событие удалено');
    }

    if (payload.resolution === 'external') {
      const external = this.parseSnapshot(conflict.external_data);
      return this.commit(conflict, event.id, {
        data: toEventData(external),
        externalId: event.external_id,
        etag: conflict.external_etag,
        resolution: 'external',
      });
    }

    const map = await this.prisma.sourceExternalMap.findFirst({
      where: { source_id: event.source_id },
      include: { external_connection: true },
    });
    if (!map || map.sync_status === 'orphaned') {
      throw new ConflictException('Источник не связан с внешним календарём');
    }

    const local = this.parseSnapshot(conflict.local_data);
    const fields =
      payload.resolution === 'merged'
        ? this.applyMerged(local, payload.merged_data)
        : this.fromEvent(event);

    const provider = this.factory.create(connection);
    const exceptions = await this.prisma.eventException.findMany({
      where: { event_id: event.id },
    });
    const remote: RemoteEvent = {
      uid: event.external_id ?? event.id,
      etag: event.external_etag,
      ical: serializeEvent({ ...event, ...toEventData(fields) }, exceptions),
    };

    let result: RemoteEvent;
    try {
      result = await provider.forcePush(map.external_calendar_id, remote);
    } catch {
      throw new ServiceUnavailableException(
        'Не удалось записать изменения во внешний календарь',
      );
    }

    return this.commit(conflict, event.id, {
      data: toEventData(fields),
      externalId: result.uid,
      etag: result.etag,
      resolution: payload.resolution,
    });
  }

  private async findOwned(userId: string, id: string): Promise<OwnedConflict> {
    const conflict = await this.prisma.syncConflict.findFirst({
      where: { id },
      include: { event: true },
    });
    if (!conflict) {
      throw new NotFoundException('Конфликт не найден');
    }
    const connection = await this.prisma.externalConnection.findFirst({
      where: { id: conflict.external_connection_id, user_id: userId },
    });
    if (!connection) {
      throw new ForbiddenException('Нет доступа к конфликту');
    }
    return { conflict, connection };
  }

  /** Транзакция: применяем поля к событию и помечаем конфликт разрешённым. */
  private async commit(
    conflict: SyncConflict,
    eventId: string,
    input: CommitInput,
  ): Promise<Event> {
    const [event] = await this.prisma.$transaction([
      this.prisma.event.update({
        where: { id: eventId },
        data: {
          ...input.data,
          external_id: input.externalId,
          external_etag: input.etag,
          sync_status: 'synced',
          last_synced_at: new Date(),
        },
      }),
      this.prisma.syncConflict.update({
        where: { id: conflict.id },
        data: { resolution: input.resolution, resolved_at: new Date() },
      }),
    ]);
    return event;
  }

  private fromEvent(event: Event): ConflictFields {
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

  private applyMerged(
    local: ConflictFields,
    merged: MergedDataDto,
  ): ConflictFields {
    return {
      title: merged.title ?? local.title,
      description:
        merged.description === undefined
          ? local.description
          : merged.description,
      start_at: (merged.start_at ?? new Date(local.start_at)).toISOString(),
      end_at: (merged.end_at ?? new Date(local.end_at)).toISOString(),
      all_day: merged.all_day ?? local.all_day,
      timezone: merged.timezone ?? local.timezone,
      location: merged.location === undefined ? local.location : merged.location,
      rrule: local.rrule,
    };
  }

  private parseSnapshot(data: unknown): ConflictFields {
    const result = conflictSnapshotSchema.safeParse(data);
    if (!result.success) {
      throw new InternalServerErrorException('Повреждённые данные конфликта');
    }
    return {
      title: result.data.title,
      description: result.data.description,
      start_at: result.data.start_at,
      end_at: result.data.end_at,
      all_day: result.data.all_day,
      timezone: result.data.timezone ?? 'UTC',
      location: result.data.location,
      rrule: result.data.rrule ?? null,
    };
  }

  private toView(
    conflict: SyncConflict & {
      event?: { id: string; title: string; source_id: string } | Event;
    },
  ) {
    return {
      id: conflict.id,
      event_id: conflict.event_id,
      connection_id: conflict.external_connection_id,
      local_data: conflict.local_data,
      external_data: conflict.external_data,
      external_etag: conflict.external_etag,
      resolution: conflict.resolution,
      resolved_at: conflict.resolved_at,
      created_at: conflict.created_at,
      event: conflict.event,
    };
  }
}
