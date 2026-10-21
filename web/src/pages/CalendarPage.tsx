import { useCallback, useMemo, useRef, useState, useTransition } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateClickArg } from '@fullcalendar/interaction';
import type {
  EventChangeArg,
  EventClickArg,
  EventContentArg,
  EventDropArg,
} from '@fullcalendar/core';
import ruLocale from '@fullcalendar/core/locales/ru';
import { Plus, Search, X } from 'lucide-react';
import { fetchEventPages, fetchSpaces, updateEvent } from '@/lib/services';
import type { CalendarEvent, EventPayload, Source } from '@/lib/types';
import { useAccessMap } from '@/hooks/access';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { EventDialog } from '@/components/EventDialog';
import { QuarterView } from '@/features/calendar/views/quarter/QuarterView';
import { YearMiniMap } from '@/features/calendar/views/year/YearMiniMap';
import {
  QUARTER_MONTHS,
  YEAR_MONTHS,
} from '@/features/calendar/lib/quarterRange';

type CalendarMode = 'normal' | 'quarter' | 'year';

function renderEventContent(arg: EventContentArg) {
  const color = (arg.event.backgroundColor as string) ?? 'var(--accent)';
  const hasConflict = arg.event.extendedProps.syncStatus === 'conflict';
  return (
    <div
      className="relative h-full overflow-hidden rounded-sm px-2 py-1 text-caption"
      style={{
        background: `${color}33`,
        borderLeft: `3px solid ${color}`,
      }}
    >
      {hasConflict && (
        <span
          className="absolute right-1 top-1 size-2 rounded-full bg-danger"
          title="Конфликт синхронизации"
        />
      )}
      {!arg.event.allDay && (
        <div className="truncate text-text-secondary">{arg.timeText}</div>
      )}
      <div className="truncate font-medium text-text-primary">
        {arg.event.title}
      </div>
    </div>
  );
}

const BUSY_COLOR = '#8D99AE';

export function CalendarPage() {
  const me = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [defaultSourceId, setDefaultSourceId] = useState<string | undefined>();
  const [defaultDate, setDefaultDate] = useState<string | null>(null);

  const [spaceFilter, setSpaceFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [search, setSearch] = useState('');
  const [range, setRange] = useState<{ from?: string; to?: string }>({});
  const calendarRef = useRef<FullCalendar>(null);
  const [mode, setMode] = useState<CalendarMode>('normal');
  const [, startTransition] = useTransition();
  const switchMode = (next: CalendarMode) =>
    startTransition(() => setMode(next));
  const [windowRange, setWindowRange] = useState<{
    from?: string;
    to?: string;
  }>({});
  const [miniYear, setMiniYear] = useState(() => new Date().getFullYear());
  const [miniMonth, setMiniMonth] = useState<number | null>(null);
  const [today] = useState(() => new Date());

  const { data: spaces = [] } = useQuery({
    queryKey: ['spaces'],
    queryFn: fetchSpaces,
  });

  const accessMap = useAccessMap(spaces);

  const sources: Source[] = useMemo(
    () => spaces.flatMap((space) => space.sources ?? []),
    [spaces],
  );

  const sourceOptions = useMemo(
    () =>
      spaceFilter
        ? sources.filter((source) => source.space_id === spaceFilter)
        : sources,
    [sources, spaceFilter],
  );

  const effectiveSourceFilter = sourceOptions.some(
    (source) => source.id === sourceFilter,
  )
    ? sourceFilter
    : '';

  const filtersActive = Boolean(
    spaceFilter || effectiveSourceFilter || search,
  );

  const { data: page, isLoading } = useQuery({
    queryKey: [
      'event-page',
      { spaceFilter, effectiveSourceFilter, search, range },
    ],
    queryFn: () =>
      fetchEventPages({
        space_id: spaceFilter || undefined,
        source_id: effectiveSourceFilter || undefined,
        q: search.trim() || undefined,
        from: range.from,
        to: range.to,
      }),
    enabled: sources.length > 0,
  });

  const events = page?.items ?? [];

  const { data: yearPage } = useQuery({
    queryKey: [
      'event-year',
      { spaceFilter, effectiveSourceFilter, search, miniYear },
    ],
    queryFn: () =>
      fetchEventPages({
        space_id: spaceFilter || undefined,
        source_id: effectiveSourceFilter || undefined,
        q: search.trim() || undefined,
        from: new Date(miniYear, 0, 1).toISOString(),
        to: new Date(miniYear + 1, 0, 1).toISOString(),
      }),
    enabled: sources.length > 0,
  });

  const yearEvents = yearPage?.items ?? [];

  const { data: windowPage, isLoading: windowLoading } = useQuery({
    queryKey: [
      'event-window',
      { spaceFilter, effectiveSourceFilter, search, windowRange },
    ],
    queryFn: () =>
      fetchEventPages({
        space_id: spaceFilter || undefined,
        source_id: effectiveSourceFilter || undefined,
        q: search.trim() || undefined,
        from: windowRange.from,
        to: windowRange.to,
      }),
    enabled:
      sources.length > 0 && mode !== 'normal' && Boolean(windowRange.from),
  });

  const windowEvents = windowPage?.items ?? [];

  const applyWindowRange = useCallback(
    (window: { start: Date; end: Date }) => {
      const from = window.start.toISOString();
      const to = window.end.toISOString();
      setWindowRange((prev) =>
        prev.from === from && prev.to === to ? prev : { from, to },
      );
    },
    [],
  );

  const colorBySource = useMemo(() => {
    const map = new Map<string, string>();
    sources.forEach((source) => map.set(source.id, source.color));
    return map;
  }, [sources]);

  const presetForSource = (sourceId: string) => {
    const source = sources.find((item) => item.id === sourceId);
    return source ? accessMap.get(source.space_id) ?? null : null;
  };

  const canEditEvent = (event: CalendarEvent): boolean => {
    if (event.busy) {
      return false;
    }
    const preset = presetForSource(event.source_id);
    if (preset === 'FULL') {
      return true;
    }
    return preset === 'OWN' && event.creator_id === me;
  };

  const canCreate = sources.some((source) => {
    const preset = accessMap.get(source.space_id);
    return preset === 'FULL' || preset === 'OWN';
  });

  const calendarEvents = events.map((event) => {
    const color = colorBySource.get(event.source_id);
    const editable = canEditEvent(event);
    return {
      id: event.id,
      title: event.title,
      start: event.start_at,
      end: event.end_at,
      allDay: event.all_day,
      backgroundColor: event.busy ? BUSY_COLOR : color,
      borderColor: event.busy ? BUSY_COLOR : color,
      classNames: event.busy ? ['opacity-70'] : [],
      extendedProps: { syncStatus: event.sync_status },
      editable,
      startEditable: editable,
      durationEditable: editable,
    };
  });

  const moveMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: EventPayload;
    }) => updateEvent(id, payload),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['event-page'] });
      queryClient.invalidateQueries({ queryKey: ['event-window'] });
      queryClient.invalidateQueries({ queryKey: ['event-year'] });
    },
  });

  const openCreate = (date?: Date, sourceId?: string) => {
    if (!canCreate) {
      return;
    }
    setEditing(null);
    setDefaultDate(date ? toDateInput(date) : null);
    setDefaultSourceId(sourceId ?? sourceOptions[0]?.id ?? sources[0]?.id);
    setDialogOpen(true);
  };

  const openEdit = (eventId: string) => {
    const found =
      events.find((event) => event.id === eventId) ??
      windowEvents.find((event) => event.id === eventId);
    if (!found || !canEditEvent(found)) {
      return;
    }
    setEditing(found);
    setDefaultSourceId(found.source_id);
    setDialogOpen(true);
  };

  const onDateClick = (info: DateClickArg) => openCreate(info.date);

  const onEventClick = (info: EventClickArg) => openEdit(info.event.id);

  const applyMove = (found: CalendarEvent, start: Date, end: Date | null) => {
    const endDate = end ?? new Date(start.getTime() + 3600_000);
    moveMutation.mutate({
      id: found.id,
      payload: {
        title: found.title,
        start_at: start.toISOString(),
        end_at: endDate.toISOString(),
        all_day: found.all_day,
        timezone: found.timezone,
        location: found.location,
        description: found.description,
      },
    });
  };

  const findEvent = (id: string): CalendarEvent | undefined =>
    events.find((event) => event.id === id) ??
    windowEvents.find((event) => event.id === id);

  const onEventDrop = (info: EventDropArg) => {
    const found = findEvent(info.event.id);
    if (!found || !info.event.start) {
      info.revert();
      return;
    }
    applyMove(found, info.event.start, info.event.end);
  };

  const onEventResize = (info: EventChangeArg) => {
    const found = findEvent(info.event.id);
    if (!found || !info.event.start) {
      info.revert();
      return;
    }
    applyMove(found, info.event.start, info.event.end);
  };

  const moveEventFromView = (event: CalendarEvent, target: Date) => {
    if (!canEditEvent(event)) {
      return;
    }
    const start = new Date(event.start_at);
    const shifted = new Date(
      target.getFullYear(),
      target.getMonth(),
      target.getDate(),
      start.getHours(),
      start.getMinutes(),
      start.getSeconds(),
      start.getMilliseconds(),
    );
    const duration = new Date(event.end_at).getTime() - start.getTime();
    applyMove(event, shifted, new Date(shifted.getTime() + duration));
  };

  const resetFilters = () => {
    setSpaceFilter('');
    setSourceFilter('');
    setSearch('');
  };

  const goToMonth = (month: Date) => {
    setMiniMonth(month.getMonth());
    switchMode('normal');
    const api = calendarRef.current?.getApi();
    api?.changeView('dayGridMonth');
    api?.gotoDate(month);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-h1 text-text-primary">
            Сводный календарь
          </h1>
          <p className="mt-1 text-body-sm text-text-secondary">
            Все события из пространств и источников в одном окне.
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => switchMode(mode === 'quarter' ? 'normal' : 'quarter')}
              disabled={sources.length === 0}
              aria-pressed={mode === 'quarter'}
            >
              {mode === 'quarter' ? 'Обычный вид' : 'Квартал'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => switchMode(mode === 'year' ? 'normal' : 'year')}
              disabled={sources.length === 0}
              aria-pressed={mode === 'year'}
            >
              {mode === 'year' ? 'Обычный вид' : 'Год'}
            </Button>
            <Button
              onClick={() => openCreate()}
              disabled={sources.length === 0 || !canCreate}
            >
              <Plus className="size-4" />
              Событие
            </Button>
          </div>
          {sources.length > 0 && !canCreate && (
            <p className="mt-1 text-caption text-text-muted">
              Нет источников, доступных для создания событий.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 xl:flex-row">
        {sources.length > 0 && (
          <aside className="hidden w-[280px] shrink-0 xl:block">
            <div className="sticky top-6">
              <YearMiniMap
                year={miniYear}
                events={yearEvents}
                today={today}
                selectedMonth={miniMonth}
                onSelectMonth={goToMonth}
                onPrevYear={() => setMiniYear((value) => value - 1)}
                onNextYear={() => setMiniYear((value) => value + 1)}
              />
            </div>
          </aside>
        )}

        <div className="min-w-0 flex-1 space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-bg-surface p-3 shadow-card">
        <Select
          containerClassName="w-[200px]"
          value={spaceFilter}
          onChange={(e) => {
            setSpaceFilter(e.target.value);
            setSourceFilter('');
          }}
          aria-label="Пространство"
        >
          <option value="">Все пространства</option>
          {spaces.map((space) => (
            <option key={space.id} value={space.id}>
              {space.name}
            </option>
          ))}
        </Select>

        <Select
          containerClassName="w-[200px]"
          value={effectiveSourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          aria-label="Источник"
        >
          <option value="">Все источники</option>
          {sourceOptions.map((source) => (
            <option key={source.id} value={source.id}>
              {source.name}
            </option>
          ))}
        </Select>

        <div className="relative min-w-48 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию"
            className="pl-9"
            aria-label="Поиск по названию"
          />
        </div>

        {filtersActive && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X className="size-4" />
            Сбросить
          </Button>
        )}

        {isLoading && (
          <span className="text-caption text-text-muted">Загрузка…</span>
        )}
        {page && (
          <span className="text-caption text-text-muted">
            Найдено: {page.total}
          </span>
        )}
      </div>

      {sources.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {sources.map((source) => {
            const active = effectiveSourceFilter === source.id;
            return (
              <button
                key={source.id}
                type="button"
                onClick={() =>
                  setSourceFilter((prev) =>
                    prev === source.id ? '' : source.id,
                  )
                }
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-caption transition-colors duration-150',
                  active
                    ? 'border-accent bg-accent-muted text-accent'
                    : 'border-border bg-bg-surface text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
                )}
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: source.color }}
                />
                {source.name}
              </button>
            );
          })}
        </div>
      )}

      <div className={mode !== 'normal' ? 'hidden' : undefined}>
        <div className="rounded-lg bg-bg-surface p-2 shadow-card sm:p-4">
          {sources.length === 0 ? (
            <p className="py-16 text-center text-body-sm text-text-secondary">
              Сначала создайте пространство и источник.
            </p>
          ) : (
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              buttonText={{
                today: 'Сегодня',
                month: 'Месяц',
                week: 'Неделя',
                day: 'День',
              }}
              height="auto"
              locale="ru"
              locales={[ruLocale]}
              firstDay={1}
              editable
              events={calendarEvents}
              eventContent={renderEventContent}
              datesSet={(info) =>
                setRange((prev) =>
                  prev.from === info.startStr && prev.to === info.endStr
                    ? prev
                    : { from: info.startStr, to: info.endStr },
                )
              }
              dateClick={onDateClick}
              eventClick={onEventClick}
              eventDrop={onEventDrop}
              eventResize={onEventResize}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }}
            />
          )}
        </div>
      </div>

      {sources.length > 0 && mode !== 'normal' && (
        <QuarterView
          key={mode}
          monthsCount={mode === 'year' ? YEAR_MONTHS : QUARTER_MONTHS}
          events={windowEvents}
          sources={sources}
          loading={isLoading || windowLoading}
          onRangeChange={applyWindowRange}
          onMoveEvent={moveEventFromView}
          onOpenMonth={goToMonth}
          onAddEvent={(date) => openCreate(date)}
          onOpenEvent={(event) => openEdit(event.id)}
        />
      )}

        </div>
      </div>

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        sources={sources}
        event={editing}
        defaultSourceId={defaultSourceId}
        defaultDate={defaultDate}
        canDelete={Boolean(editing) && canEditEvent(editing as CalendarEvent)}
      />
    </section>
  );
}

function toDateInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
