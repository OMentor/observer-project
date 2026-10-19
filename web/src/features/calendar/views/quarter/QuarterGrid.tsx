import { memo } from 'react';
import { cn } from '@/lib/cn';
import { MonthMini } from '@/features/calendar/views/quarter/MonthMini';
import { isYearWindow } from '@/features/calendar/lib/quarterRange';
import type { CalendarEvent } from '@/lib/types';

export interface QuarterGridProps {
  months: Date[];
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

export const QuarterGrid = memo(function QuarterGrid({
  months,
  eventsByDay,
  colorBySource,
  today,
  selectedKey,
  hideWeekends = false,
  showDots = true,
  onSelectDay,
  onSelectMonth,
  onDropDay,
}: QuarterGridProps) {
  const gridClass = isYearWindow(months.length)
    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    : months.length <= 4
      ? 'grid-cols-1 md:grid-cols-2'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <div className={cn('grid gap-4', gridClass)}>
      {months.map((month) => (
        <MonthMini
          key={month.toISOString()}
          month={month}
          eventsByDay={eventsByDay}
          colorBySource={colorBySource}
          today={today}
          selectedKey={selectedKey}
          hideWeekends={hideWeekends}
          showDots={showDots}
          onSelectDay={onSelectDay}
          onSelectMonth={onSelectMonth}
          onDropDay={onDropDay}
        />
      ))}
    </div>
  );
});
