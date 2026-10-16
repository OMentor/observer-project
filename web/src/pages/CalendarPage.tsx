import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateClickArg } from '@fullcalendar/interaction';
import type {
  EventChangeArg,
  EventClickArg,
  EventDropArg,
} from '@fullcalendar/core';
import ruLocale from '@fullcalendar/core/locales/ru';
import { Plus, Search, X } from 'lucide-react';
import { fetchEventPage, fetchSpaces, updateEvent } from '@/lib/services';
import type { CalendarEvent, EventPayload, Source } from '@/lib/types';
import { useAccessMap } from '@/hooks/access';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EventDialog } from '@/components/EventDialog';

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
      fetchEventPage({
        space_id: spaceFilter || undefined,
        source_id: effectiveSourceFilter || undefined,
        q: search.trim() || undefined,
        from: range.from,
        to: range.to,
        pageSize: 200,
      }),
    enabled: sources.length > 0,
  });

  const events = page?.items ?? [];

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
    const found = events.find((event) => event.id === eventId);
    if (!found || !canEditEvent(found)) {
      return;
    }
    setEditing(found);
    setDefaultSourceId(found.source_id);
    setDialogOpen(true);
  };

  const onDateClick = (info: DateClickArg) => openCreate(info.date);

  const onEventClick = (info: EventClickArg) => openEdit(info.event.id);

  const applyMove = (id: string, start: Date, end: Date | null) => {
    const found = events.find((event) => event.id === id);
    if (!found) {
      return;
    }
    const endDate = end ?? new Date(start.getTime() + 3600_000);
    moveMutation.mutate({
      id,
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

  const onEventDrop = (info: EventDropArg) => {
    if (!info.event.start) {
      info.revert();
      return;
    }
    applyMove(info.event.id, info.event.start, info.event.end);
  };

  const onEventResize = (info: EventChangeArg) => {
    if (!info.event.start) {
      info.revert();
      return;
    }
    applyMove(info.event.id, info.event.start, info.event.end);
  };

  const resetFilters = () => {
    setSpaceFilter('');
    setSourceFilter('');
    setSearch('');
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-text">Сводный календарь</h1>
          <p className="mt-1 text-sm text-muted">
            Все события из пространств и источников в одном окне.
          </p>
        </div>
        <div className="text-right">
          <Button
            onClick={() => openCreate()}
            disabled={sources.length === 0 || !canCreate}
          >
            <Plus className="size-4" />
            Событие
          </Button>
          {sources.length > 0 && !canCreate && (
            <p className="mt-1 text-xs text-muted">
              Нет источников, доступных для создания событий.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3">
        <select
          value={spaceFilter}
          onChange={(e) => {
            setSpaceFilter(e.target.value);
            setSourceFilter('');
          }}
          className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
        >
          <option value="">Все пространства</option>
          {spaces.map((space) => (
            <option key={space.id} value={space.id}>
              {space.name}
            </option>
          ))}
        </select>

        <select
          value={effectiveSourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
        >
          <option value="">Все источники</option>
          {sourceOptions.map((source) => (
            <option key={source.id} value={source.id}>
              {source.name}
            </option>
          ))}
        </select>

        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию"
            className="pl-9"
          />
        </div>

        {filtersActive && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X className="size-4" />
            Сбросить
          </Button>
        )}

        {isLoading && <span className="text-xs text-muted">Загрузка…</span>}
        {page && (
          <span className="text-xs text-muted">
            Найдено: {page.total}
          </span>
        )}
      </div>

      {sources.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {sources.map((source) => (
            <button
              key={source.id}
              type="button"
              onClick={() =>
                setSourceFilter((prev) =>
                  prev === source.id ? '' : source.id,
                )
              }
              className={
                effectiveSourceFilter === source.id
                  ? 'inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs text-accent'
                  : 'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs text-muted hover:bg-surface'
              }
            >
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: source.color }}
              />
              {source.name}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface p-2 sm:p-4">
        {sources.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">
            Сначала создайте пространство и источник.
          </p>
        ) : (
          <FullCalendar
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
            datesSet={(info) =>
              setRange({ from: info.startStr, to: info.endStr })
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
