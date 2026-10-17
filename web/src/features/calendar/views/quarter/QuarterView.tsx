import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import type { CalendarEvent, Source } from '@/lib/types';
import { useEventDensity } from '@/features/calendar/hooks/useEventDensity';
import { useQuarterNavigation } from '@/features/calendar/hooks/useQuarterNavigation';
import { QuarterToolbar } from '@/features/calendar/views/quarter/QuarterToolbar';
import { QuarterGrid } from '@/features/calendar/views/quarter/QuarterGrid';
import { DayDetailPanel } from '@/features/calendar/views/quarter/DayDetailPanel';
import { addMonths, quarterKey } from '@/features/calendar/lib/quarterRange';
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
}

function buildQuarterOptions(start: Date) {
  return Array.from({ length: 9 }, (_, index) => {
    const optionStart = addMonths(start, (index - 4) * 3);
    return { key: quarterKey(optionStart), start: optionStart };
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
}: QuarterViewProps) {
  const navigation = useQuarterNavigation(initialDate);
  const density = useEventDensity(events);
  const [selected, setSelected] = useState<Date | null>(null);
  const [hideWeekends, setHideWeekends] = useState(false);
  const [busyOnly, setBusyOnly] = useState(false);

  const colorBySource = useMemo(() => {
    const map = new Map<string, string>();
    sources.forEach((source) => map.set(source.id, source.color));
    return map;
  }, [sources]);

  const quarterOptions = useMemo(
    () => buildQuarterOptions(navigation.start),
    [navigation.start],
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
            options={quarterOptions}
            onChange={(key) => {
              const option = quarterOptions.find((item) => item.key === key);
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
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
