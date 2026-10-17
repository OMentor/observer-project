import { describe, expect, it } from 'vitest';
import type { CalendarEvent } from '@/lib/types';
import {
  monthEventCounts,
  weekdayIndex,
  yearCellClass,
  yearCellLevel,
  yearHeatMatrix,
} from '@/features/calendar/lib/yearDensity';

function makeEvent(id: string, start: Date): CalendarEvent {
  return {
    id,
    source_id: 's1',
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

describe('yearDensity', () => {
  it('maps counts to year levels', () => {
    expect(yearCellLevel(0)).toBe(0);
    expect(yearCellLevel(2)).toBe(1);
    expect(yearCellLevel(6)).toBe(2);
    expect(yearCellLevel(12)).toBe(3);
    expect(yearCellLevel(13)).toBe(4);
  });

  it('maps year levels to classes', () => {
    expect(yearCellClass(0)).toBe('bg-bg-elevated');
    expect(yearCellClass(1)).toBe('bg-accent-muted');
    expect(yearCellClass(2)).toBe('bg-accent/60');
    expect(yearCellClass(3)).toBe('bg-amber-muted');
    expect(yearCellClass(4)).toBe('bg-danger-muted');
  });

  it('computes a Monday-based weekday index', () => {
    expect(weekdayIndex(new Date(2026, 9, 12))).toBe(0);
    expect(weekdayIndex(new Date(2026, 9, 18))).toBe(6);
  });

  it('builds a 12x7 heat matrix for the year', () => {
    const events = [
      makeEvent('a', new Date(2026, 9, 12)),
      makeEvent('b', new Date(2026, 9, 12)),
      makeEvent('c', new Date(2025, 9, 12)),
    ];
    const matrix = yearHeatMatrix(events, 2026);
    expect(matrix).toHaveLength(12);
    expect(matrix[9]).toHaveLength(7);
    expect(matrix[9][0]).toBe(2);
    expect(matrix[0].every((value) => value === 0)).toBe(true);
  });

  it('counts events per month', () => {
    const events = [
      makeEvent('a', new Date(2026, 9, 12)),
      makeEvent('b', new Date(2026, 9, 20)),
      makeEvent('c', new Date(2026, 0, 5)),
    ];
    const counts = monthEventCounts(events, 2026);
    expect(counts[9]).toBe(2);
    expect(counts[0]).toBe(1);
    expect(counts[5]).toBe(0);
  });
});
