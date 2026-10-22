import ical, { RRule, VEvent } from 'node-ical';

export interface ParsedEvent {
  uid: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
  timezone: string;
  rrule: string | null;
  recurrenceId: Date | null;
  exdates: Date[];
}

export interface ParsedSeries {
  parent: ParsedEvent;
  exceptions: ParsedEvent[];
  exdates: Date[];
}

function normalizeTimezone(tz: string | undefined): string {
  if (!tz || tz === 'Etc/UTC' || tz === 'UTC' || tz === 'Z') {
    return 'UTC';
  }
  return tz;
}

function toUtcMidnight(date: Date): Date {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
}

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

function rruleText(rule: RRule | undefined): string | null {
  if (!rule) {
    return null;
  }
  const text = rule.toString();
  const line = text
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => item.startsWith('RRULE:'));
  return line ? line.slice('RRULE:'.length) : text.trim() || null;
}

function uniqueDates(dates: Date[]): Date[] {
  const seen = new Set<number>();
  return dates.filter((date) => {
    const time = date.getTime();
    if (seen.has(time)) {
      return false;
    }
    seen.add(time);
    return true;
  });
}

function toParsedEvent(event: VEvent, fallbackUid: string): ParsedEvent | null {
  const start = event.start;
  if (!(start instanceof Date)) {
    return null;
  }
  const allDay = event.datetype === 'date' || start.dateOnly === true;
  let endAt = event.end instanceof Date ? event.end : start;
  let startAt = start;
  if (allDay) {
    startAt = toUtcMidnight(startAt);
    endAt = toUtcMidnight(endAt);
  }
  const recurrenceId =
    event.recurrenceid instanceof Date
      ? allDay
        ? toUtcMidnight(event.recurrenceid)
        : event.recurrenceid
      : null;
  const exdates = uniqueDates(
    Object.values(event.exdate ?? {})
      .filter((date): date is Date => date instanceof Date)
      .map((date) => (allDay ? toUtcMidnight(date) : date)),
  );
  return {
    uid: event.uid ?? fallbackUid,
    title: asText(event.summary) ?? 'Без названия',
    description: asText(event.description),
    location: asText(event.location),
    startAt,
    endAt,
    allDay,
    timezone: normalizeTimezone(start.tz),
    rrule: rruleText(event.rrule),
    recurrenceId,
    exdates,
  };
}

export function parseIcalSeries(ics: string): ParsedSeries | null {
  const parsed = ical.sync.parseICS(ics);
  let parent: ParsedEvent | null = null;
  const overrides = new Map<number, ParsedEvent>();

  for (const key of Object.keys(parsed)) {
    const component = parsed[key];
    if (!component || component.type !== 'VEVENT') {
      continue;
    }
    const event = component as VEvent;
    const own = toParsedEvent(event, key);
    if (own?.recurrenceId) {
      overrides.set(own.recurrenceId.getTime(), own);
    } else if (own && !parent) {
      parent = own;
    }
    for (const recurrence of Object.values(event.recurrences ?? {})) {
      const override = toParsedEvent(recurrence as VEvent, event.uid ?? key);
      if (override?.recurrenceId) {
        overrides.set(override.recurrenceId.getTime(), override);
      }
    }
  }

  if (!parent) {
    return null;
  }
  return {
    parent,
    exceptions: [...overrides.values()].sort(
      (a, b) =>
        a.recurrenceId!.getTime() - b.recurrenceId!.getTime(),
    ),
    exdates: parent.exdates,
  };
}

export function parseIcalEvent(ics: string): ParsedEvent | null {
  return parseIcalSeries(ics)?.parent ?? null;
}
