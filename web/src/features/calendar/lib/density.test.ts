import { describe, expect, it } from 'vitest';
import type { CalendarEvent } from '@/lib/types';
import {
  dayKey,
  densityClass,
  densityLevel,
  groupEventsByDay,
  summarizeDay,
} from '@/features/calendar/lib/density';

function makeEvent(id: string, start: Date, sourceId = 's1'): CalendarEvent {
  return {
    id,
    source_id: sourceId,
    creator_id: 'u1',
    title: `Event ${id}`,
    description: null,
    start_at: start.toISOString(),
    end_at: new Date(start.getTime() + 3_600_000).toISOString(),
    all_day: false,
    timezone: 'UTC',
    location: null,
    rrule: null,
    created_at: start.toISOString(),
    updated_at: start.toISOString(),
  };
}

describe('density', () => {
  it('formats a local day key', () => {
    expect(dayKey(new Date(2026, 9, 5))).toBe('2026-10-05');
  });

  it('maps counts to density levels', () => {
    expect(densityLevel(0)).toBe(0);
    expect(densityLevel(5)).toBe(0);
    expect(densityLevel(6)).toBe(1);
    expect(densityLevel(10)).toBe(1);
    expect(densityLevel(11)).toBe(2);
    expect(densityLevel(15)).toBe(2);
    expect(densityLevel(16)).toBe(3);
    expect(densityLevel(40)).toBe(3);
  });

  it('maps density levels to tailwind classes', () => {
    expect(densityClass(0)).toBe('');
    expect(densityClass(1)).toBe('bg-accent-muted/30');
    expect(densityClass(2)).toBe('bg-amber-muted/30');
    expect(densityClass(3)).toBe('bg-danger-muted/30');
  });

  it('groups events by their start day', () => {
    const events = [
      makeEvent('a', new Date(2026, 9, 15, 9)),
      makeEvent('b', new Date(2026, 9, 15, 14)),
      makeEvent('c', new Date(2026, 9, 16, 9)),
    ];
    const grouped = groupEventsByDay(events);
    expect(grouped.get('2026-10-15')).toHaveLength(2);
    expect(grouped.get('2026-10-16')).toHaveLength(1);
  });

  it('summarizes a day with source colors', () => {
    const colorBySource = new Map([['s1', '#111111']]);
    const events = [
      makeEvent('a', new Date(2026, 9, 15, 9)),
      makeEvent('b', new Date(2026, 9, 15, 10)),
    ];
    const summary = summarizeDay(events, colorBySource);
    expect(summary.count).toBe(2);
    expect(summary.level).toBe(0);
    expect(summary.colors).toEqual(['#111111', '#111111']);
  });

  it('treats an empty day as empty', () => {
    const summary = summarizeDay(undefined, new Map());
    expect(summary.count).toBe(0);
    expect(summary.colors).toEqual([]);
  });
});
