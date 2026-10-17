import type { CalendarEvent } from '@/lib/types';

export const MONTHS_SHORT = [
  'янв',
  'фев',
  'мар',
  'апр',
  'май',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
];

export type YearLevel = 0 | 1 | 2 | 3 | 4;

export const YEAR_THRESHOLDS = {
  low: 2,
  medium: 6,
  high: 12,
} as const;

export function yearCellLevel(count: number): YearLevel {
  if (count <= 0) {
    return 0;
  }
  if (count <= YEAR_THRESHOLDS.low) {
    return 1;
  }
  if (count <= YEAR_THRESHOLDS.medium) {
    return 2;
  }
  if (count <= YEAR_THRESHOLDS.high) {
    return 3;
  }
  return 4;
}

const YEAR_CLASS: Record<YearLevel, string> = {
  0: 'bg-bg-elevated',
  1: 'bg-accent-muted',
  2: 'bg-accent/60',
  3: 'bg-amber-muted',
  4: 'bg-danger-muted',
};

export function yearCellClass(level: YearLevel): string {
  return YEAR_CLASS[level];
}

export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function yearHeatMatrix(
  events: CalendarEvent[],
  year: number,
): number[][] {
  const matrix = Array.from({ length: 12 }, () =>
    new Array<number>(7).fill(0),
  );
  for (const event of events) {
    const date = new Date(event.start_at);
    if (Number.isNaN(date.getTime()) || date.getFullYear() !== year) {
      continue;
    }
    matrix[date.getMonth()][weekdayIndex(date)] += 1;
  }
  return matrix;
}

export function monthEventCounts(
  events: CalendarEvent[],
  year: number,
): number[] {
  const counts = new Array<number>(12).fill(0);
  for (const event of events) {
    const date = new Date(event.start_at);
    if (Number.isNaN(date.getTime()) || date.getFullYear() !== year) {
      continue;
    }
    counts[date.getMonth()] += 1;
  }
  return counts;
}
