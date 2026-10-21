import { Injectable } from '@nestjs/common';
import { Event, EventException } from '@prisma/client';
import { Options, RRule } from 'rrule';

export type ExpandedEvent = Event & {
  recurring_event_id?: string;
  original_start_at?: string;
  is_recurring?: boolean;
};

type ExpandParams = {
  event: Event;
  exceptions: EventException[];
  from: Date;
  to: Date;
  limit?: number;
};

const DEFAULT_LIMIT = 1000;
const UTC = 'UTC';

const formatters = new Map<string, Intl.DateTimeFormat>();

function normalizeTimezone(timezone: string): string {
  if (formatters.has(timezone)) {
    return timezone;
  }
  try {
    formatters.set(
      timezone,
      new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      }),
    );
    return timezone;
  } catch {
    if (!formatters.has(UTC)) {
      formatters.set(
        UTC,
        new Intl.DateTimeFormat('en-US', {
          timeZone: UTC,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hourCycle: 'h23',
        }),
      );
    }
    return UTC;
  }
}

function wallParts(date: Date, timezone: string) {
  const values: Record<string, number> = {};
  for (const part of formatters.get(timezone)!.formatToParts(date)) {
    if (part.type !== 'literal') {
      values[part.type] = Number(part.value);
    }
  }
  return values;
}

function toWallDate(date: Date, timezone: string): Date {
  const p = wallParts(date, timezone);
  return new Date(
    Date.UTC(
      p.year,
      p.month - 1,
      p.day,
      p.hour,
      p.minute,
      p.second,
      date.getUTCMilliseconds(),
    ),
  );
}

function offsetAt(date: Date, timezone: string): number {
  return toWallDate(date, timezone).getTime() - date.getTime();
}

function fromWallDate(wall: Date, timezone: string): Date {
  let instant = new Date(wall.getTime() - offsetAt(wall, timezone));
  const corrected = new Date(wall.getTime() - offsetAt(instant, timezone));
  if (corrected.getTime() !== instant.getTime()) {
    instant = corrected;
  }
  return instant;
}

function overlaps(start: Date, end: Date, from: Date, to: Date): boolean {
  return (
    start.getTime() < to.getTime() &&
    (end.getTime() > from.getTime() || start.getTime() === from.getTime())
  );
}

function buildRule(event: Event): RRule | null {
  if (!event.rrule) {
    return null;
  }
  const timezone = normalizeTimezone(event.timezone);
  try {
    const parsed: Partial<Options> = RRule.parseString(event.rrule);
    if (parsed.freq === undefined || parsed.freq === null) {
      return null;
    }
    parsed.dtstart = toWallDate(event.start_at, timezone);
    if (parsed.until) {
      parsed.until = toWallDate(parsed.until, timezone);
    }
    parsed.tzid = null;
    return new RRule(parsed, true);
  } catch {
    return null;
  }
}

@Injectable()
export class RecurrenceService {
  expand({
    event,
    exceptions,
    from,
    to,
    limit = DEFAULT_LIMIT,
  }: ExpandParams): ExpandedEvent[] {
    if (from.getTime() >= to.getTime()) {
      return [];
    }

    const timezone = normalizeTimezone(event.timezone);
    const rule = buildRule(event);
    const duration = Math.max(
      0,
      event.end_at.getTime() - event.start_at.getTime(),
    );

    if (!rule) {
      const fallback: ExpandedEvent = event;
      return overlaps(event.start_at, event.end_at, from, to) ? [fallback] : [];
    }

    const maxDuration = exceptions.reduce((max, exception) => {
      if (!exception.start_at || !exception.end_at) {
        return max;
      }
      return Math.max(
        max,
        exception.end_at.getTime() - exception.start_at.getTime(),
      );
    }, duration);

    const generationFrom = new Date(from.getTime() - maxDuration);
    const starts = rule.between(
      toWallDate(generationFrom, timezone),
      toWallDate(to, timezone),
      true,
    );

    const exceptionByOriginal = new Map(
      exceptions.map((exception) => [
        exception.occurrence_at.getTime(),
        exception,
      ]),
    );
    const usedExceptions = new Set<number>();
    const occurrences: ExpandedEvent[] = [];

    const buildOccurrence = (
      originalStart: Date,
      exception: EventException | undefined,
    ): ExpandedEvent => {
      const start = exception?.start_at ?? originalStart;
      const end = exception?.end_at ?? new Date(start.getTime() + duration);
      return {
        ...event,
        id: `${event.id}@${originalStart.getTime()}`,
        title: exception?.title ?? event.title,
        description: exception?.description ?? event.description,
        start_at: start,
        end_at: end,
        all_day: exception?.all_day ?? event.all_day,
        timezone: exception?.timezone ?? event.timezone,
        location: exception?.location ?? event.location,
        rrule: exception?.rrule ?? event.rrule,
        recurrence_parent_id: event.id,
        external_etag: exception?.external_etag ?? event.external_etag,
        sync_status: exception?.sync_status ?? event.sync_status,
        updated_at: exception?.updated_at ?? event.updated_at,
        recurring_event_id: event.id,
        original_start_at: originalStart.toISOString(),
        is_recurring: true,
      };
    };

    for (const wallStart of starts) {
      const originalStart = fromWallDate(wallStart, timezone);
      const exception = exceptionByOriginal.get(originalStart.getTime());
      if (exception) {
        usedExceptions.add(originalStart.getTime());
      }
      if (exception?.is_deleted) {
        continue;
      }
      const occurrence = buildOccurrence(originalStart, exception);
      if (overlaps(occurrence.start_at, occurrence.end_at, from, to)) {
        occurrences.push(occurrence);
      }
    }

    for (const exception of exceptions) {
      if (
        usedExceptions.has(exception.occurrence_at.getTime()) ||
        exception.is_deleted ||
        !exception.start_at
      ) {
        continue;
      }
      const occurrence = buildOccurrence(exception.occurrence_at, exception);
      if (overlaps(occurrence.start_at, occurrence.end_at, from, to)) {
        occurrences.push(occurrence);
      }
    }

    occurrences.sort((a, b) => a.start_at.getTime() - b.start_at.getTime());
    return occurrences.slice(0, Math.max(1, limit));
  }
}
