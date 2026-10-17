import { CalendarPlus, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { CalendarEvent } from '@/lib/types';
import {
  dayTitle,
  formatTime,
  groupDaySections,
} from '@/features/calendar/lib/daySections';

export interface DayDetailPanelProps {
  date: Date | null;
  events: CalendarEvent[];
  colorBySource: Map<string, string>;
  loading?: boolean;
  error?: boolean;
  onAddEvent?: (date: Date) => void;
  onOpenEvent?: (event: CalendarEvent) => void;
  onClose?: () => void;
}

export function DayDetailPanel({
  date,
  events,
  colorBySource,
  loading = false,
  error = false,
  onAddEvent,
  onOpenEvent,
  onClose,
}: DayDetailPanelProps) {
  return (
    <aside
      className="flex w-full flex-col rounded-[14px] bg-bg-surface p-4 shadow-card lg:w-80"
      aria-label="Детали дня"
    >
      {!date ? (
        <p className="py-12 text-center text-body-sm text-text-secondary">
          Выберите день, чтобы увидеть события.
        </p>
      ) : (
        <>
          <header className="mb-3 flex items-start justify-between gap-2">
            <h3 className="font-serif text-h4 text-text-primary">
              {dayTitle(date)}
            </h3>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть панель"
                className="rounded-md p-1 text-text-muted transition-colors duration-150 hover:bg-bg-elevated hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              >
                <X className="size-4" />
              </button>
            )}
          </header>

          {loading ? (
            <div className="space-y-2" aria-hidden>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <p className="py-8 text-center text-body-sm text-danger">
              Не удалось загрузить события.
            </p>
          ) : events.length === 0 ? (
            <p className="py-8 text-center text-body-sm text-text-secondary">
              В этот день событий нет.
            </p>
          ) : (
            <div className="space-y-4">
              {groupDaySections(events).map((section) => (
                <section key={section.id} className="space-y-2">
                  <p className="text-overline uppercase text-text-secondary">
                    {section.label}
                  </p>
                  <ul className="space-y-1.5">
                    {section.events.map((event) => (
                      <li key={event.id}>
                        <button
                          type="button"
                          onClick={() => onOpenEvent?.(event)}
                          className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-150 hover:bg-bg-elevated focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                        >
                          {!event.all_day && (
                            <span className="pt-0.5 font-mono text-caption text-text-secondary">
                              {formatTime(event.start_at)}
                            </span>
                          )}
                          <span
                            className="mt-1 size-2.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor: event.busy
                                ? 'var(--text-muted)'
                                : colorBySource.get(event.source_id) ??
                                  'var(--accent)',
                            }}
                          />
                          <span
                            className={cn(
                              'text-body-sm',
                              event.busy
                                ? 'italic text-text-secondary'
                                : 'text-text-primary',
                            )}
                          >
                            {event.busy ? 'Занято' : event.title}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}

          {onAddEvent && (
            <div className="mt-4 border-t border-border pt-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => onAddEvent(date)}
              >
                <CalendarPlus className="size-4" />
                Добавить событие
              </Button>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
