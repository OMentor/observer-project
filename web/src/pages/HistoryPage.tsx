import { useMemo, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { fetchEventHistory, fetchEvents, fetchSpaces } from '@/lib/services';
import type { CalendarEvent, EventHistoryEntry, Source } from '@/lib/types';

const ACTION_LABELS: Record<EventHistoryEntry['action'], string> = {
  CREATED: 'Создано',
  UPDATED: 'Изменено',
  DELETED: 'Удалено',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU');
}

function diff(entry: EventHistoryEntry): string | null {
  const oldTitle = entry.old_data?.title;
  const newTitle = entry.new_data?.title;
  if (entry.action === 'UPDATED' && oldTitle !== newTitle) {
    return `${String(oldTitle ?? '—')} → ${String(newTitle ?? '—')}`;
  }
  return null;
}

export function HistoryPage() {
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

  const [selectedId, setSelectedId] = useState('');
  const selected = events.find((event) => event.id === selectedId);

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['history', selectedId],
    queryFn: () => fetchEventHistory(selectedId),
    enabled: Boolean(selectedId) && !selected?.busy,
  });

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-text">История</h1>
        <p className="mt-1 text-sm text-muted">
          Журнал изменений событий: кто и когда создал, изменил или удалил.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/40 p-10 text-center text-sm text-muted">
          Событий пока нет.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-2">
            <label
              htmlFor="history-event"
              className="text-sm font-medium text-muted"
            >
              Событие
            </label>
            <select
              id="history-event"
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
            >
              <option value="">— выберите событие —</option>
              {events.map((event) => (
                <option key={event.id} value={event.id} disabled={event.busy}>
                  {event.title} · {formatDate(event.start_at)}
                  {event.busy ? ' (занято)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {!selectedId ? (
              <div className="rounded-xl border border-dashed border-border bg-surface/40 p-10 text-center text-sm text-muted">
                Выберите событие, чтобы увидеть его историю.
              </div>
            ) : isLoading ? (
              <p className="text-sm text-muted">Загрузка…</p>
            ) : history.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-surface/40 p-10 text-center text-sm text-muted">
                История пуста.
              </div>
            ) : (
              <ol className="space-y-2">
                {history.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-xl border border-border bg-surface px-4 py-3"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text">
                        {ACTION_LABELS[entry.action]}
                      </span>
                      <span className="text-xs text-muted">
                        {formatDate(entry.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {entry.user.name}
                      {diff(entry) && ` · ${diff(entry)}`}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
