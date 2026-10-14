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
import { Button } from '@/components/ui/button';
import { EventDialog } from '@/components/EventDialog';

export function CalendarPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [defaultSourceId, setDefaultSourceId] = useState<string | undefined>();
  const [defaultDate, setDefaultDate] = useState<string | null>(null);

  const { data: spaces = [] } = useQuery({
    queryKey: ['spaces'],
    queryFn: fetchSpaces,
  });

  const sources: Source[] = useMemo(
    () => spaces.flatMap((space) => space.sources ?? []),
    [spaces],
  );

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

  const calendarEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.start_at,
    end: event.end_at,
    allDay: event.all_day,
    backgroundColor: colorBySource.get(event.source_id),
    borderColor: colorBySource.get(event.source_id),
  }));

  const openCreate = (date?: Date, sourceId?: string) => {
    setEditing(null);
    setDefaultDate(date ? toDateInput(date) : null);
    setDefaultSourceId(sourceId ?? sources[0]?.id);
    setDialogOpen(true);
  };

  const openEdit = (eventId: string) => {
    const found = events.find((event) => event.id === eventId);
    if (found) {
      setEditing(found);
      setDefaultSourceId(found.source_id);
      setDialogOpen(true);
    }
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
        <Button onClick={() => openCreate()} disabled={sources.length === 0}>
          <Plus className="size-4" />
          Событие
        </Button>
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
