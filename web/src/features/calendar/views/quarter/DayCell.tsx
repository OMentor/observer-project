import { memo } from 'react';
import { cn } from '@/lib/cn';
import { DensityDots } from '@/features/calendar/views/quarter/DensityDots';
import { densityClass, type DensityLevel } from '@/features/calendar/lib/density';

export interface DayCellProps {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isSelected: boolean;
  count: number;
  level: DensityLevel;
  colors: string[];
  showDots?: boolean;
  label?: string;
  onSelect: (date: Date) => void;
}

export const DayCell = memo(function DayCell({
  date,
  inMonth,
  isToday,
  isWeekend,
  isSelected,
  count,
  level,
  colors,
  showDots = true,
  label,
  onSelect,
}: DayCellProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(date)}
      aria-label={label}
      aria-current={isToday ? 'date' : undefined}
      className={cn(
        'flex h-14 flex-col items-start gap-1 rounded-md px-1.5 py-1 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent',
        inMonth ? 'text-text-secondary' : 'text-text-muted opacity-40',
        isWeekend && inMonth && 'bg-bg-elevated/30',
        densityClass(level),
        isToday && 'bg-accent-muted',
        isToday && 'ring-1 ring-accent',
        isSelected && 'bg-accent-muted ring-2 ring-accent',
        'hover:ring-1 hover:ring-accent',
      )}
    >
      <span
        className={cn(
          'text-caption leading-none',
          isToday && 'font-medium text-accent',
        )}
      >
        {date.getDate()}
      </span>
      {showDots && inMonth && (
        <DensityDots colors={colors} count={count} />
      )}
    </button>
  );
});
