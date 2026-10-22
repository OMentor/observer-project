import ical, { ICalCalendarMethod } from 'ical-generator';
import type { Event, EventException } from '@prisma/client';

function formatUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

function exdateLine(date: Date, allDay: boolean): string {
  return allDay
    ? `EXDATE;VALUE=DATE:${formatDateOnly(date)}`
    : `EXDATE:${formatUtc(date)}`;
}

function withExdates(ics: string, lines: string[]): string {
  if (lines.length === 0) {
    return ics;
  }
  const rows = ics.split('\r\n');
  const index = rows.findIndex((row) => row.startsWith('RRULE:'));
  if (index === -1) {
    return ics;
  }
  rows.splice(index + 1, 0, ...lines);
  return rows.join('\r\n');
}

export function serializeEvent(
  event: Event,
  exceptions: EventException[] = [],
): string {
  const calendar = ical({
    prodId: '//Pletenie//Sync//RU',
    method: ICalCalendarMethod.PUBLISH,
  });

  const uid = event.external_id ?? event.id;
  const duration = event.end_at.getTime() - event.start_at.getTime();

  calendar.createEvent({
    id: uid,
    start: event.start_at,
    end: event.end_at,
    allDay: event.all_day,
    stamp: event.updated_at,
    lastModified: event.updated_at,
    summary: event.title,
    description: event.description ?? undefined,
    location: event.location ?? undefined,
    repeating: event.rrule ?? undefined,
  });

  for (const exception of exceptions) {
    if (exception.is_deleted) {
      continue;
    }
    const start = exception.start_at ?? exception.occurrence_at;
    const end = exception.end_at ?? new Date(start.getTime() + duration);
    calendar.createEvent({
      id: uid,
      recurrenceId: exception.occurrence_at,
      start,
      end,
      allDay: exception.all_day ?? event.all_day,
      stamp: exception.updated_at,
      lastModified: exception.updated_at,
      summary: exception.title ?? event.title,
      description: exception.description ?? event.description ?? undefined,
      location: exception.location ?? event.location ?? undefined,
    });
  }

  const exdates = exceptions
    .filter((exception) => exception.is_deleted)
    .map((exception) =>
      exdateLine(exception.occurrence_at, event.all_day),
    );

  return withExdates(calendar.toString(), exdates);
}
