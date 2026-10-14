import { useMemo, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ruLocale from '@fullcalendar/core/locales/ru';
import { Plus } from 'lucide-react';
import { fetchEvents, fetchSpaces } from '@/lib/services';
import type { CalendarEvent, Source } from '@/lib/types';
import { useAccessMap } from '@/hooks/access';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { EventDialog } from '@/components/EventDialog';

export function CalendarPage() {
  const me = useAuthStore((s) => s.user?.id);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [defaultSourceId, setDefaultSourceId] = useState<string | undefined>();
  const [defaultDate, setDefaultDate] = useState<string | null>(null);

  const { data: spaces = [] } = useQuery({
    queryKey: ['spaces'],
    queryFn: fetchSpaces,
  });

  const accessMap = useAccessMap(spaces);

  const sources: Source[] = useMemo(
    () => spaces.flatMap((space) => space.sources ?? []),
    [spaces],
  );

  const presetForSource = (sourceId: string) => {
    const source = sources.find((item) => item.id === sourceId);
    return source ? accessMap.get(source.space_id) ?? null : null;
  };

  const canCreate = sources.some((source) => {
    const preset = accessMap.get(source.space_id);
    return preset === 'FULL' || preset === 'OWN';
  });

  const eventQueries = useQueries({
    queries: sources.map((source) => ({
      queryKey: ['events', source.id],
      queryFn: () => fetchEvents(source.id),
      enabled: Boolean(source.id),
    })),
  });

  const events: CalendarEvent[] = eventQueries.flatMap(
    (query) => query.data ?? [],
  );

  const colorBySource = useMemo(() => {
    const map = new Map<string, string>();
    sources.forEach((source) => map.set(source.id, source.color));
    return map;
  }, [sources]);

  const calendarEvents = events.map((event) => {
    const color = colorBySource.get(event.source_id);
    return {
      id: event.id,
      title: event.title,
      start: event.start_at,
      end: event.end_at,
      allDay: event.all_day,
      backgroundColor: event.busy ? '#8D99AE' : color,
      borderColor: event.busy ? '#8D99AE' : color,
      classNames: event.busy ? ['opacity-70'] : [],
    };
  });

  const openCreate = (date?: Date, sourceId?: string) => {
    if (!canCreate) {
      return;
    }
    setEditing(null);
    setDefaultDate(date ? toDateInput(date) : null);
    setDefaultSourceId(sourceId ?? sources[0]?.id);
    setDialogOpen(true);
  };

  const openEdit = (eventId: string) => {
    const found = events.find((event) => event.id === eventId);
    if (!found || found.busy) {
      return;
    }
    const preset = presetForSource(found.source_id);
    const canEdit =
      preset === 'FULL' ||
      (preset === 'OWN' && found.creator_id === me);
    if (!canEdit) {
      return;
    }
    setEditing(found);
    setDefaultSourceId(found.source_id);
    setDialogOpen(true);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
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

      {sources.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {sources.map((source) => (
            <span
              key={source.id}
              className="inline-flex items-center gap-2 text-xs text-muted"
            >
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: source.color }}
              />
              {source.name}
            </span>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface p-4">
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
            events={calendarEvents}
            dateClick={(info) => openCreate(info.date)}
            eventClick={(info) => openEdit(info.event.id)}
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
      />
    </section>
  );
}

function toDateInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
