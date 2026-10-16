import { useMemo, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { fetchEventHistory, fetchEvents, fetchSpaces } from '@/lib/services';
import type { CalendarEvent, EventHistoryEntry, Source } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

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
  const [sourceFilter, setSourceFilter] = useState('');
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<
    '' | EventHistoryEntry['action']
  >('');

  const filteredEvents = events.filter(
    (event) =>
      (!sourceFilter || event.source_id === sourceFilter) &&
      (!search || event.title.toLowerCase().includes(search.toLowerCase())),
  );

  const selected = events.find((event) => event.id === selectedId);

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['history', selectedId],
    queryFn: () => fetchEventHistory(selectedId),
    enabled: Boolean(selectedId) && !selected?.busy,
  });

  const visibleHistory = actionFilter
    ? history.filter((entry) => entry.action === actionFilter)
    : history;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-serif text-h1 text-text-primary">История</h1>
        <p className="mt-1 text-body-sm text-text-secondary">
          Журнал изменений событий: кто и когда создал, изменил или удалил.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-bg-surface/40 p-10 text-center text-body-sm text-text-secondary">
          Событий пока нет.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-3">
            <div className="space-y-1">
              <label
                htmlFor="history-source"
                className="text-body-sm font-medium text-text-secondary"
              >
                Источник
              </label>
              <Select
                id="history-source"
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value)}
              >
                <option value="">Все источники</option>
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </Select>
            </div>

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по названию"
            />

            <div className="space-y-1">
              <label
                htmlFor="history-event"
                className="text-body-sm font-medium text-text-secondary"
              >
                Событие
              </label>
              <Select
                id="history-event"
                value={selectedId}
                onChange={(event) => setSelectedId(event.target.value)}
              >
                <option value="">— выберите событие —</option>
                {filteredEvents.map((event) => (
                  <option key={event.id} value={event.id} disabled={event.busy}>
                    {event.title} · {formatDate(event.start_at)}
                    {event.busy ? ' (занято)' : ''}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            {!selectedId ? (
              <div className="rounded-lg border border-dashed border-border bg-bg-surface/40 p-10 text-center text-body-sm text-text-secondary">
                Выберите событие, чтобы увидеть его историю.
              </div>
            ) : isLoading ? (
              <p className="text-body-sm text-text-secondary">Загрузка…</p>
            ) : history.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-bg-surface/40 p-10 text-center text-body-sm text-text-secondary">
                История пуста.
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActionFilter('')}
                    className={
                      actionFilter === ''
                        ? 'rounded-full bg-accent-muted px-3 py-1 text-xs text-accent'
                        : 'rounded-full px-3 py-1 text-caption text-text-muted hover:bg-bg-surface'
                    }
                  >
                    Все
                  </button>
                  {(
                    Object.keys(ACTION_LABELS) as EventHistoryEntry['action'][]
                  ).map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => setActionFilter(action)}
                      className={
                        actionFilter === action
                          ? 'rounded-full bg-accent-muted px-3 py-1 text-xs text-accent'
                          : 'rounded-full px-3 py-1 text-caption text-text-muted hover:bg-bg-surface'
                      }
                    >
                      {ACTION_LABELS[action]}
                    </button>
                  ))}
                </div>
                {visibleHistory.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-bg-surface/40 p-10 text-center text-body-sm text-text-secondary">
                    Нет записей с этим действием.
                  </div>
                ) : (
                  <ol className="space-y-2">
                    {visibleHistory.map((entry) => (
                      <li
                        key={entry.id}
                        className="rounded-lg bg-bg-surface px-4 py-3 shadow-card"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text">
                            {ACTION_LABELS[entry.action]}
                          </span>
                          <span className="text-caption text-text-muted">
                            {formatDate(entry.created_at)}
                          </span>
                        </div>
                        <p className="mt-1 text-caption text-text-muted">
                          {entry.user.name}
                          {diff(entry) && ` · ${diff(entry)}`}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
