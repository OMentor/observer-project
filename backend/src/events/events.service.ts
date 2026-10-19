import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Event, Preset } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SpaceAccess, SpacesService } from '../spaces/spaces.service';
import { RealtimeService } from '../realtime/realtime.service';
import { RealtimeEvents } from '../realtime/realtime.events';
import { SyncQueueService } from '../sync/queue/sync-queue.service';
import { isEventMasked, maskEvent } from './event-mask';
import {
  CreateEventDto,
  ListAllEventsDto,
  ListEventsDto,
  UpdateEventDto,
} from './events.dto';

function snapshot(event: Event) {
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

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly spaces: SpacesService,
    private readonly realtime: RealtimeService,
    private readonly syncQueue: SyncQueueService,
  ) {}

  async create(userId: string, sourceId: string, dto: CreateEventDto) {
    const { access, source } = await this.resolveSource(userId, sourceId);
    this.assertCanWrite(access, userId, null);
    const event = await this.prisma.event.create({
      data: {
        source_id: sourceId,
        creator_id: userId,
        title: dto.title,
        description: dto.description,
        start_at: dto.start_at,
        end_at: dto.end_at,
        all_day: dto.all_day ?? false,
        timezone: dto.timezone ?? 'UTC',
        location: dto.location,
        rrule: dto.rrule,
      },
    });
    await this.writeHistory(event.id, userId, 'CREATED', null, snapshot(event));
    await this.realtime.eventChanged(
      RealtimeEvents.eventCreated,
      event,
      source,
      userId,
    );
    await this.maybeEnqueuePush(event.source_id, event.id);
    return event;
  }

  async findAll(userId: string, sourceId: string, query: ListEventsDto) {
    const { access } = await this.resolveSource(userId, sourceId);
    const events = await this.prisma.event.findMany({
      where: {
        source_id: sourceId,
        deleted_at: null,
        ...(query.from || query.to
          ? {
              start_at: {
                ...(query.from ? { gte: query.from } : {}),
                ...(query.to ? { lte: query.to } : {}),
              },
            }
          : {}),
      },
      orderBy: { start_at: 'asc' },
    });
    return events.map((event) => this.mask(event, access, userId));
  }

  async findOne(userId: string, eventId: string) {
    const { event, access } = await this.loadWithAccess(userId, eventId);
    return this.mask(event, access, userId);
  }

  async findAllAcross(userId: string, query: ListAllEventsDto) {
    const spaces = await this.prisma.space.findMany({
      where: {
        deleted_at: null,
        OR: [
          { owner_id: userId },
          { members: { some: { user_id: userId, revoked_at: null } } },
        ],
      },
      select: {
        id: true,
        owner_id: true,
        sources: {
          where: { deleted_at: null },
          select: { id: true, visibility: true },
        },
        members: {
          where: { user_id: userId, revoked_at: null },
          select: { preset: true },
        },
      },
    });

    const presetBySpace = new Map<string, Preset>();
    const spaceBySource = new Map<string, string>();
    const allowedSourceIds: string[] = [];

    for (const space of spaces) {
      const preset: Preset | undefined =
        space.owner_id === userId ? 'FULL' : space.members[0]?.preset;
      if (!preset) {
        continue;
      }
      presetBySpace.set(space.id, preset);
      for (const source of space.sources) {
        if (source.visibility === 'PRIVATE' && preset !== 'FULL') {
          continue;
        }
        spaceBySource.set(source.id, space.id);
        allowedSourceIds.push(source.id);
      }
    }

    if (query.space_id && !presetBySpace.has(query.space_id)) {
      throw new ForbiddenException('Нет доступа к пространству');
    }
    if (query.source_id && !spaceBySource.has(query.source_id)) {
      throw new ForbiddenException('Нет доступа к источнику');
    }

    let sourceIds = allowedSourceIds;
    if (query.source_id) {
      sourceIds = [query.source_id];
    } else if (query.space_id) {
      sourceIds = allowedSourceIds.filter(
        (id) => spaceBySource.get(id) === query.space_id,
      );
    }

    const page = query.page;
    const pageSize = query.pageSize;

    if (sourceIds.length === 0) {
      return { items: [], total: 0, page, pageSize };
    }

    const where = {
      source_id: { in: sourceIds },
      deleted_at: null,
      ...(query.creator_id ? { creator_id: query.creator_id } : {}),
      ...(query.from || query.to
        ? {
            start_at: {
              ...(query.from ? { gte: query.from } : {}),
              ...(query.to ? { lte: query.to } : {}),
            },
          }
        : {}),
      ...(query.q
        ? { title: { contains: query.q, mode: 'insensitive' as const } }
        : {}),
    };

    const [total, events] = await this.prisma.$transaction([
      this.prisma.event.count({ where }),
      this.prisma.event.findMany({
        where,
        orderBy: { start_at: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: events.map((event) => {
        const spaceId = spaceBySource.get(event.source_id) as string;
        const preset = presetBySpace.get(spaceId) as Preset;
        return this.mask(
          event,
          { isOwner: preset === 'FULL', preset },
          userId,
        );
      }),
      total,
      page,
      pageSize,
    };
  }

  async update(userId: string, eventId: string, dto: UpdateEventDto) {
    const { event: current, access, source } = await this.loadWithAccess(
      userId,
      eventId,
    );
    this.assertCanWrite(access, userId, current);
    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        title: dto.title,
        description: dto.description,
        start_at: dto.start_at,
        end_at: dto.end_at,
        all_day: dto.all_day,
        timezone: dto.timezone,
        location: dto.location,
        rrule: dto.rrule,
      },
    });
    await this.writeHistory(
      eventId,
      userId,
      'UPDATED',
      snapshot(current),
      snapshot(updated),
    );
    await this.realtime.eventChanged(
      RealtimeEvents.eventUpdated,
      updated,
      source,
      userId,
    );
    await this.maybeEnqueuePush(updated.source_id, updated.id);
    return updated;
  }

  async remove(userId: string, eventId: string) {
    const { event: current, access, source } = await this.loadWithAccess(
      userId,
      eventId,
    );
    this.assertCanWrite(access, userId, current);
    await this.prisma.event.update({
      where: { id: eventId },
      data: { deleted_at: new Date() },
    });
    await this.writeHistory(eventId, userId, 'DELETED', snapshot(current), null);
    await this.realtime.eventChanged(
      RealtimeEvents.eventDeleted,
      current,
      source,
      userId,
    );
    await this.maybeEnqueuePush(current.source_id, current.id);
    return { success: true };
  }

  async history(userId: string, eventId: string) {
    const { event, access } = await this.loadWithAccess(userId, eventId);
    if (this.isMasked(event, access, userId)) {
      throw new ForbiddenException('История события недоступна');
    }
    return this.prisma.eventHistory.findMany({
      where: { event_id: eventId },
      orderBy: { created_at: 'desc' },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  private isMasked(event: Event, access: SpaceAccess, userId: string) {
    return isEventMasked(event, access.preset, userId);
  }

  private mask(event: Event, access: SpaceAccess, userId: string) {
    return maskEvent(event, access.preset, userId);
  }

  private assertCanWrite(
    access: SpaceAccess,
    userId: string,
    event: Event | null,
  ) {
    if (access.preset === 'FULL') {
      return;
    }
    if (access.preset === 'OWN') {
      if (event && event.creator_id !== userId) {
        throw new ForbiddenException('Можно изменять только свои события');
      }
      return;
    }
    throw new ForbiddenException('Недостаточно прав для изменения событий');
  }

  private async loadWithAccess(userId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, deleted_at: null },
    });
    if (!event) {
      throw new NotFoundException('Событие не найдено');
    }
    const source = await this.prisma.source.findFirst({
      where: { id: event.source_id },
      select: { space_id: true, visibility: true },
    });
    if (!source) {
      throw new NotFoundException('Источник не найден');
    }
    const access = await this.spaces.getAccess(userId, source.space_id);
    return { event, access, source };
  }

  /**
   * Ставит push-задачу, если источник связан с внешним календарём и запись
   * разрешена (`both`/`out`). Иначе событие остаётся локальным.
   */
  private async maybeEnqueuePush(sourceId: string, eventId: string) {
    const map = await this.prisma.sourceExternalMap.findFirst({
      where: {
        source_id: sourceId,
        sync_status: 'active',
        sync_direction: { not: 'in' },
      },
      select: { id: true },
    });
    if (map) {
      await this.syncQueue.enqueuePush(eventId);
    }
  }

  private async resolveSource(userId: string, sourceId: string) {    const source = await this.prisma.source.findFirst({
      where: { id: sourceId, deleted_at: null },
      select: { id: true, space_id: true, visibility: true },
    });
    if (!source) {
      throw new NotFoundException('Источник не найден');
    }
    const access = await this.spaces.getAccess(userId, source.space_id);
    return { source, access };
  }

  private async writeHistory(
    eventId: string,
    userId: string,
    action: 'CREATED' | 'UPDATED' | 'DELETED',
    oldData: object | null,
    newData: object | null,
  ) {
    await this.prisma.eventHistory.create({
      data: {
        event_id: eventId,
        user_id: userId,
        action,
        old_data: oldData ?? undefined,
        new_data: newData ?? undefined,
      },
    });
  }
}
