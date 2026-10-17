import { useMemo } from 'react';
import type { CalendarEvent } from '@/lib/types';
import {
  dayKey,
  densityLevel,
  groupEventsByDay,
  type DensityLevel,
} from '@/features/calendar/lib/density';

export type DensityIndex = {
  byDay: Map<string, CalendarEvent[]>;
  countByDay: Map<string, number>;
  levelByDay: Map<string, DensityLevel>;
};

export function useEventDensity(events: CalendarEvent[]): DensityIndex {
  return useMemo(() => {
    const byDay = groupEventsByDay(events);
    const countByDay = new Map<string, number>();
    const levelByDay = new Map<string, DensityLevel>();
    byDay.forEach((list, key) => {
      countByDay.set(key, list.length);
      levelByDay.set(key, densityLevel(list.length));
    });
    return { byDay, countByDay, levelByDay };
  }, [events]);
}

export function densityForDate(
  index: DensityIndex,
  date: Date,
): { count: number; level: DensityLevel } {
  const key = dayKey(date);
  return {
    count: index.countByDay.get(key) ?? 0,
    level: index.levelByDay.get(key) ?? 0,
  };
}
