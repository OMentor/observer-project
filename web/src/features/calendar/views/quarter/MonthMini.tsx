import { memo, useMemo } from 'react';
import { cn } from '@/lib/cn';
import { DayCell } from '@/features/calendar/views/quarter/DayCell';
import {
  WEEKDAYS_SHORT,
  WEEKDAYS_WORK,
  monthGrid,
  monthLabel,
  sameDay,
} from '@/features/calendar/lib/quarterRange';
import { dayKey, summarizeDay } from '@/features/calendar/lib/density';
import type { CalendarEvent } from '@/lib/types';

export interface MonthMiniProps {
  month: Date;
  eventsByDay: Map<string, CalendarEvent[]>;
  colorBySource: Map<string, string>;
  today: Date;
  selectedKey?: string | null;
  hideWeekends?: boolean;
  showDots?: boolean;
  onSelectDay: (date: Date) => void;
  onSelectMonth?: (month: Date) => void;
  onDropDay?: (date: Date) => void;
}

export const MonthMini = memo(function MonthMini({
  month,
  eventsByDay,
  colorBySource,
  today,
  selectedKey,
  hideWeekends = false,
  showDots = true,
  onSelectDay,
  onSelectMonth,
  onDropDay,
}: MonthMiniProps) {
  const weeks = useMemo(() => monthGrid(month), [month]);
  const weekdayLabels = hideWeekends ? WEEKDAYS_WORK : WEEKDAYS_SHORT;

  return (
    <div className="rounded-[14px] bg-bg-surface p-5 shadow-card">
      <button
        type="button"
        onClick={() => onSelectMonth?.(month)}
        className="mb-3 block text-left font-serif text-h3 text-text-primary transition-colors duration-150 hover:text-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
      >
        {monthLabel(month)}
      </button>
      <div
        className={cn(
          'mb-1 grid gap-1',
          hideWeekends ? 'grid-cols-5' : 'grid-cols-7',
        )}
      >
        {weekdayLabels.map((label) => (
          <span
            key={label}
            className="text-center text-overline uppercase text-text-secondary"
          >
            {label}
          </span>
        ))}
      </div>
      <div
        className={cn(
          'grid gap-1',
          hideWeekends ? 'grid-cols-5' : 'grid-cols-7',
        )}
      >
        {weeks.flat().map((date) => {
          if (hideWeekends && (date.getDay() === 0 || date.getDay() === 6)) {
            return null;
          }
          const summary = summarizeDay(
            eventsByDay.get(dayKey(date)),
            colorBySource,
          );
          return (
            <DayCell
              key={date.toISOString()}
              date={date}
              inMonth={date.getMonth() === month.getMonth()}
              isToday={sameDay(date, today)}
              isWeekend={date.getDay() === 0 || date.getDay() === 6}
              isSelected={selectedKey === dayKey(date)}
              count={summary.count}
              level={summary.level}
              colors={summary.colors}
              showDots={showDots}
              label={`${date.getDate()} ${monthLabel(date)}`}
              onSelect={onSelectDay}
              onDropDay={onDropDay}
            />
          );
        })}
      </div>
    </div>
  );
});
