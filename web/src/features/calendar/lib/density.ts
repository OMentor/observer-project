import type { CalendarEvent } from '@/lib/types';

export type DensityLevel = 0 | 1 | 2 | 3;

export const DENSITY_THRESHOLDS = {
  low: 6,
  medium: 11,
  high: 16,
} as const;

export function densityLevel(count: number): DensityLevel {
  if (count >= DENSITY_THRESHOLDS.high) {
    return 3;
  }
  if (count >= DENSITY_THRESHOLDS.medium) {
    return 2;
  }
  if (count >= DENSITY_THRESHOLDS.low) {
    return 1;
  }
  return 0;
}

const DENSITY_CLASS: Record<DensityLevel, string> = {
  0: '',
  1: 'bg-accent-muted/30',
  2: 'bg-amber-muted/30',
  3: 'bg-danger-muted/30',
};

export function densityClass(level: DensityLevel): string {
  return DENSITY_CLASS[level];
}

export function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function groupEventsByDay(
  events: CalendarEvent[],
): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const start = new Date(event.start_at);
    if (Number.isNaN(start.getTime())) {
      continue;
    }
    const key = dayKey(start);
    const list = map.get(key);
    if (list) {
      list.push(event);
    } else {
      map.set(key, [event]);
    }
  }
  return map;
}

export type DaySummary = {
  count: number;
  level: DensityLevel;
  colors: string[];
};

export function summarizeDay(
  dayEvents: CalendarEvent[] | undefined,
  colorBySource: Map<string, string>,
): DaySummary {
  const list = dayEvents ?? [];
  return {
    count: list.length,
    level: densityLevel(list.length),
    colors: list.map(
      (event) => colorBySource.get(event.source_id) ?? 'var(--accent)',
    ),
  };
}
