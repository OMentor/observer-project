import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Event } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SpaceAccess, SpacesService } from '../spaces/spaces.service';
import {
  CreateEventDto,
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
  ) {}

  async create(userId: string, sourceId: string, dto: CreateEventDto) {
    const { access } = await this.resolveSource(userId, sourceId);
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

  async update(userId: string, eventId: string, dto: UpdateEventDto) {
    const { event: current, access } = await this.loadWithAccess(
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
    return updated;
  }

  async remove(userId: string, eventId: string) {
    const { event: current, access } = await this.loadWithAccess(
      userId,
      eventId,
    );
    this.assertCanWrite(access, userId, current);
    await this.prisma.event.update({
      where: { id: eventId },
      data: { deleted_at: new Date() },
    });
    await this.writeHistory(eventId, userId, 'DELETED', snapshot(current), null);
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
    return (
      access.preset === 'BUSY' ||
      (access.preset === 'OWN' && event.creator_id !== userId)
    );
  }

  private mask(event: Event, access: SpaceAccess, userId: string) {
    if (!this.isMasked(event, access, userId)) {
      return { ...event, busy: false };
    }
    return {
      ...event,
      title: 'Занято',
      description: null,
      location: null,
      busy: true,
    };
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
      select: { space_id: true },
    });
    if (!source) {
      throw new NotFoundException('Источник не найден');
    }
    const access = await this.spaces.getAccess(userId, source.space_id);
    return { event, access };
  }

  private async resolveSource(userId: string, sourceId: string) {
    const source = await this.prisma.source.findFirst({
      where: { id: sourceId, deleted_at: null },
      select: { id: true, space_id: true },
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
