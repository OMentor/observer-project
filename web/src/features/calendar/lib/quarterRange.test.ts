import { describe, expect, it } from 'vitest';
import {
  addMonths,
  monthGrid,
  monthLabel,
  quarterKey,
  quarterRange,
  sameDay,
  startOfQuarter,
  startOfWeek,
  windowLabel,
} from '@/features/calendar/lib/quarterRange';

describe('quarterRange', () => {
  it('floors a date to the start of its quarter', () => {
    expect(startOfQuarter(new Date(2026, 9, 15))).toEqual(
      new Date(2026, 9, 1),
    );
    expect(startOfQuarter(new Date(2026, 0, 1))).toEqual(
      new Date(2026, 0, 1),
    );
    expect(startOfQuarter(new Date(2026, 11, 31))).toEqual(
      new Date(2026, 9, 1),
    );
  });

  it('builds a four-month window starting at the quarter', () => {
    const range = quarterRange(new Date(2026, 9, 15));
    expect(range.months).toEqual([
      new Date(2026, 9, 1),
      new Date(2026, 10, 1),
      new Date(2026, 11, 1),
      new Date(2027, 0, 1),
    ]);
    expect(range.key).toBe('Q4 2026');
    expect(range.label).toBe('окт. 2026 – янв. 2027');
  });

  it('formats a window inside a single year without the start year', () => {
    expect(
      windowLabel([
        new Date(2026, 0, 1),
        new Date(2026, 1, 1),
        new Date(2026, 2, 1),
      ]),
    ).toBe('янв. – мар. 2026');
  });

  it('derives the quarter key from the first month', () => {
    expect(quarterKey(new Date(2026, 0, 1))).toBe('Q1 2026');
    expect(quarterKey(new Date(2026, 3, 1))).toBe('Q2 2026');
    expect(quarterKey(new Date(2026, 6, 1))).toBe('Q3 2026');
    expect(quarterKey(new Date(2026, 9, 1))).toBe('Q4 2026');
  });

  it('shifts months by whole months', () => {
    expect(addMonths(new Date(2026, 9, 1), 1)).toEqual(new Date(2026, 10, 1));
    expect(addMonths(new Date(2026, 0, 1), -1)).toEqual(new Date(2025, 11, 1));
  });

  it('builds a 6x7 month grid starting on Monday', () => {
    const weeks = monthGrid(new Date(2026, 1, 1));
    expect(weeks).toHaveLength(6);
    expect(weeks[0]).toHaveLength(7);
    expect(weeks[0][0].getDay()).toBe(1);
    expect(sameDay(weeks[0][0], new Date(2026, 0, 26))).toBe(true);
  });

  it('computes the Monday of a week', () => {
    expect(startOfWeek(new Date(2026, 9, 15))).toEqual(new Date(2026, 9, 12));
    expect(startOfWeek(new Date(2026, 9, 12))).toEqual(new Date(2026, 9, 12));
  });

  it('formats a month label', () => {
    expect(monthLabel(new Date(2026, 9, 1))).toBe('Октябрь 2026');
  });
});
