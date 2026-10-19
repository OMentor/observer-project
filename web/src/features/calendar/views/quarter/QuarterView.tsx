import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import type { CalendarEvent, Source } from '@/lib/types';
import { useEventDensity } from '@/features/calendar/hooks/useEventDensity';
import { useQuarterNavigation } from '@/features/calendar/hooks/useQuarterNavigation';
import { QuarterToolbar } from '@/features/calendar/views/quarter/QuarterToolbar';
import { QuarterGrid } from '@/features/calendar/views/quarter/QuarterGrid';
import { DayDetailPanel } from '@/features/calendar/views/quarter/DayDetailPanel';
import {
  QUARTER_MONTHS,
  YEAR_MONTHS,
  addMonths,
  isYearWindow,
  quarterKey,
} from '@/features/calendar/lib/quarterRange';
import { dayKey } from '@/features/calendar/lib/density';

export interface QuarterViewProps {
  events: CalendarEvent[];
  sources: Source[];
  initialDate?: Date;
  loading?: boolean;
  error?: boolean;
  onOpenMonth?: (month: Date) => void;
  onAddEvent?: (date: Date) => void;
  onOpenEvent?: (event: CalendarEvent) => void;
  monthsCount?: number;
  onRangeChange?: (window: { start: Date; end: Date }) => void;
  onMoveEvent?: (event: CalendarEvent, target: Date) => void;
}

function buildQuarterOptions(start: Date) {
  return Array.from({ length: 9 }, (_, index) => {
    const optionStart = addMonths(start, (index - 4) * 3);
    return { key: quarterKey(optionStart), start: optionStart };
  });
}

function buildYearOptions(start: Date) {
  return Array.from({ length: 9 }, (_, index) => {
    const optionStart = addMonths(start, (index - 4) * YEAR_MONTHS);
    return { key: String(optionStart.getFullYear()), start: optionStart };
  });
}

export function QuarterView({
  events,
  sources,
  initialDate,
  loading = false,
  error = false,
  onOpenMonth,
  onAddEvent,
  onOpenEvent,
  monthsCount = QUARTER_MONTHS,
  onRangeChange,
  onMoveEvent,
}: QuarterViewProps) {
  const yearMode = isYearWindow(monthsCount);
  const navigation = useQuarterNavigation(initialDate, monthsCount);
  const density = useEventDensity(events);
  const [selected, setSelected] = useState<Date | null>(null);
  const [hideWeekends, setHideWeekends] = useState(false);
  const [busyOnly, setBusyOnly] = useState(false);
  const dragEventRef = useRef<CalendarEvent | null>(null);

  const rangeStart = navigation.range.start;
  const rangeEnd = navigation.range.end;

  useEffect(() => {
    onRangeChange?.({ start: rangeStart, end: rangeEnd });
  }, [rangeStart, rangeEnd, onRangeChange]);

  const handleDragEvent = useCallback((event: CalendarEvent) => {
    dragEventRef.current = event;
  }, []);

  const handleDropDay = useCallback(
    (date: Date) => {
      const dragged = dragEventRef.current;
      dragEventRef.current = null;
      if (!dragged || !onMoveEvent) {
        return;
      }
      const source = new Date(dragged.start_at);
      if (
        source.getFullYear() !== date.getFullYear() ||
        source.getMonth() !== date.getMonth()
      ) {
        return;
      }
      onMoveEvent(dragged, date);
    },
    [onMoveEvent],
  );

  const dropHandler = onMoveEvent ? handleDropDay : undefined;
  const dragHandler = onMoveEvent ? handleDragEvent : undefined;

  const colorBySource = useMemo(() => {
    const map = new Map<string, string>();
    sources.forEach((source) => map.set(source.id, source.color));
    return map;
  }, [sources]);

  const windowOptions = useMemo(
    () =>
      yearMode
        ? buildYearOptions(navigation.start)
        : buildQuarterOptions(navigation.start),
    [navigation.start, yearMode],
  );

  const selectedKey = selected ? dayKey(selected) : null;
  const selectedEvents = selectedKey
    ? density.byDay.get(selectedKey) ?? []
    : [];

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex-1 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <QuarterToolbar
            label={navigation.label}
            value={navigation.key}
            options={windowOptions}
            kind={yearMode ? 'year' : 'quarter'}
            onChange={(key) => {
              const option = windowOptions.find((item) => item.key === key);
              if (option) {
                navigation.goTo(option.start);
              }
            }}
            onPrev={navigation.prev}
            onNext={navigation.next}
            onToday={navigation.goToday}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-pressed={busyOnly}
              onClick={() => setBusyOnly((value) => !value)}
              className={cn(
                'rounded-lg border px-2.5 py-1 text-caption transition-colors duration-150',
                busyOnly
                  ? 'border-accent bg-accent-muted text-accent'
                  : 'border-border bg-bg-surface text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
              )}
            >
              Только занятость
            </button>
            <button
              type="button"
              aria-pressed={hideWeekends}
              onClick={() => setHideWeekends((value) => !value)}
              className={cn(
                'rounded-lg border px-2.5 py-1 text-caption transition-colors duration-150',
                hideWeekends
                  ? 'border-accent bg-accent-muted text-accent'
                  : 'border-border bg-bg-surface text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
              )}
            >
              Скрыть выходные
            </button>
          </div>
        </div>

        <QuarterGrid
          months={navigation.range.months}
          eventsByDay={density.byDay}
          colorBySource={colorBySource}
          today={navigation.today}
          selectedKey={selectedKey}
          hideWeekends={hideWeekends}
          showDots={!busyOnly}
          onSelectDay={(date) => setSelected(date)}
          onSelectMonth={onOpenMonth}
          onDropDay={dropHandler}
        />
      </div>

      <DayDetailPanel
        date={selected}
        events={selectedEvents}
        colorBySource={colorBySource}
        loading={loading}
        error={error}
        onAddEvent={onAddEvent}
        onOpenEvent={onOpenEvent}
        onDragEvent={dragHandler}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
