import { Injectable, NotFoundException } from '@nestjs/common';
import { Event } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';
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
    await this.resolveSource(userId, sourceId);
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
    await this.resolveSource(userId, sourceId);
    return this.prisma.event.findMany({
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
  }

  async findOne(userId: string, eventId: string) {
    return this.load(userId, eventId);
  }

  async update(userId: string, eventId: string, dto: UpdateEventDto) {
    const current = await this.load(userId, eventId);
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
    const current = await this.load(userId, eventId);
    await this.prisma.event.update({
      where: { id: eventId },
      data: { deleted_at: new Date() },
    });
    await this.writeHistory(eventId, userId, 'DELETED', snapshot(current), null);
    return { success: true };
  }

  async history(userId: string, eventId: string) {
    await this.load(userId, eventId);
    return this.prisma.eventHistory.findMany({
      where: { event_id: eventId },
      orderBy: { created_at: 'desc' },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  private async load(userId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, deleted_at: null },
    });
    if (!event) {
      throw new NotFoundException('Событие не найдено');
    }
    await this.spaces.ensureMember(userId, await this.spaceOfSource(event.source_id));
    return event;
  }

  private async resolveSource(userId: string, sourceId: string) {
    const source = await this.prisma.source.findFirst({
      where: { id: sourceId, deleted_at: null },
      select: { id: true, space_id: true },
    });
    if (!source) {
      throw new NotFoundException('Источник не найден');
    }
    await this.spaces.ensureMember(userId, source.space_id);
    return source;
  }

  private async spaceOfSource(sourceId: string): Promise<string> {
    const source = await this.prisma.source.findFirst({
      where: { id: sourceId },
      select: { space_id: true },
    });
    if (!source) {
      throw new NotFoundException('Источник не найден');
    }
    return source.space_id;
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
