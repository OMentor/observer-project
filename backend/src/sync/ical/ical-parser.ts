import ical, { VEvent } from 'node-ical';

/** Нормализованное событие, извлечённое из iCalendar-полезной нагрузки. */
export interface ParsedEvent {
  /** UID события (`VEVENT.UID`). */
  uid: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
  /** TZID начала (или `UTC`, если не задан). */
  timezone: string;
  /** RRULE в виде строки (`FREQ=...`) или `null`. */
  rrule: string | null;
}

/** Нормализует TZID: UTC-варианты приводим к `UTC`. */
function normalizeTimezone(tz: string | undefined): string {
  if (!tz || tz === 'Etc/UTC' || tz === 'UTC' || tz === 'Z') {
    return 'UTC';
  }
  return tz;
}

/**
 * node-ical парсит значения `VALUE=DATE` как полночь в локальной зоне процесса.
 * Для событий на весь день приводим дату к полуночи UTC по календарным
 * компонентам, чтобы результат не зависел от TZ сервера.
 */
function toUtcMidnight(date: Date): Date {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
}

/**
 * node-ical возвращает текстовые свойства либо строкой, либо `{ val, params }`.
 * Приводим оба варианта к строке.
 */
function asText(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value === 'object' && 'val' in value) {
    const val = (value as { val?: unknown }).val;
    if (typeof val === 'string') {
      return val;
    }
  }
  return null;
}

/**
 * Парсит первый `VEVENT` из iCalendar-строки.
 * Возвращает `null`, если события нет или оно некорректно.
 */
export function parseIcalEvent(ics: string): ParsedEvent | null {
  const parsed = ical.sync.parseICS(ics);
  for (const key of Object.keys(parsed)) {
    const component = parsed[key];
    if (!component || component.type !== 'VEVENT') {
      continue;
    }
    const event = component as VEvent;
    const start = event.start;
    if (!(start instanceof Date)) {
      continue;
    }
    const allDay = event.datetype === 'date' || start.dateOnly === true;
    let endAt = event.end instanceof Date ? event.end : start;
    let startAt = start;
    if (allDay) {
      startAt = toUtcMidnight(startAt);
      endAt = toUtcMidnight(endAt);
    }
    return {
      uid: event.uid ?? key,
      title: asText(event.summary) ?? 'Без названия',
      description: asText(event.description),
      location: asText(event.location),
      startAt,
      endAt,
      allDay,
      timezone: normalizeTimezone(start.tz),
      rrule: event.rrule ? event.rrule.toString() : null,
    };
  }
  return null;
}
