import { memo, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import type { CalendarEvent } from '@/lib/types';
import {
  MONTHS_SHORT,
  monthEventCounts,
  yearCellClass,
  yearCellLevel,
  yearHeatMatrix,
} from '@/features/calendar/lib/yearDensity';

const WEEKDAY_LETTERS = ['П', 'В', 'С', 'Ч', 'П', 'С', 'В'];

export interface YearMiniMapProps {
  year: number;
  events: CalendarEvent[];
  today?: Date;
  selectedMonth?: number | null;
  onSelectMonth: (month: Date) => void;
  onPrevYear: () => void;
  onNextYear: () => void;
}

export const YearMiniMap = memo(function YearMiniMap({
  year,
  events,
  today,
  selectedMonth = null,
  onSelectMonth,
  onPrevYear,
  onNextYear,
}: YearMiniMapProps) {
  const matrix = useMemo(() => yearHeatMatrix(events, year), [events, year]);
  const counts = useMemo(
    () => monthEventCounts(events, year),
    [events, year],
  );

  return (
    <div className="rounded-[14px] bg-bg-surface p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="font-serif text-h4 text-text-primary">{year}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrevYear}
            aria-label="Предыдущий год"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNextYear}
            aria-label="Следующий год"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-1">
        <span aria-hidden />
        {WEEKDAY_LETTERS.map((letter, index) => (
          <span
            key={index}
            className="text-center text-caption text-text-muted"
            aria-hidden
          >
            {letter}
          </span>
        ))}

        {matrix.map((weekdays, month) => {
          const isCurrentMonth =
            today !== undefined &&
            today.getFullYear() === year &&
            today.getMonth() === month;
          const isSelected = selectedMonth === month;
          return (
            <MonthRow
              key={month}
              month={month}
              weekdays={weekdays}
              count={counts[month]}
              isCurrentMonth={isCurrentMonth}
              isSelected={isSelected}
              onSelectMonth={onSelectMonth}
              year={year}
            />
          );
        })}
      </div>
    </div>
  );
});

function MonthRow({
  month,
  weekdays,
  count,
  isCurrentMonth,
  isSelected,
  year,
  onSelectMonth,
}: {
  month: number;
  weekdays: number[];
  count: number;
  isCurrentMonth: boolean;
  isSelected: boolean;
  year: number;
  onSelectMonth: (month: Date) => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => onSelectMonth(new Date(year, month, 1))}
        aria-label={`${MONTHS_SHORT[month]} ${year}`}
        aria-current={isCurrentMonth ? 'date' : undefined}
        className={cn(
          'pr-1 text-right text-caption transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent',
          isCurrentMonth ? 'font-medium text-accent' : 'text-text-secondary',
          isSelected && 'text-accent',
        )}
      >
        {MONTHS_SHORT[month]}
      </button>
      {weekdays.map((cellCount, weekday) => {
        const level = yearCellLevel(cellCount);
        return (
          <button
            key={weekday}
            type="button"
            onClick={() => onSelectMonth(new Date(year, month, 1))}
            aria-label={`${MONTHS_SHORT[month]} ${year}, ${cellCount} событий`}
            className={cn(
              'h-3.5 w-full rounded-[3px] transition-colors duration-150 hover:ring-1 hover:ring-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent',
              yearCellClass(level),
              isSelected && 'ring-1 ring-accent',
            )}
            title={`${MONTHS_SHORT[month]} ${year}: ${count}`}
          />
        );
      })}
    </>
  );
}
