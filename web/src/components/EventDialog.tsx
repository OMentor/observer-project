import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createEvent,
  fetchEventHistory,
  updateEvent,
} from '@/lib/services';
import { useAuthStore } from '@/store/auth';
import type { CalendarEvent, EventHistoryEntry, Source } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

const ACTION_LABELS: Record<EventHistoryEntry['action'], string> = {
  CREATED: 'Создано',
  UPDATED: 'Изменено',
  DELETED: 'Удалено',
};

function toParts(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type FormValues = {
  title: string;
  sourceId: string;
  date: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location: string;
  description: string;
};

function initialForm(
  event: CalendarEvent | null | undefined,
  sources: Source[],
  defaultSourceId: string | undefined,
  defaultDate: string | null | undefined,
): FormValues {
  if (event) {
    const start = toParts(event.start_at);
    const end = toParts(event.end_at);
    return {
      title: event.title,
      sourceId: event.source_id,
      date: start.date,
      startTime: start.time,
      endTime: end.time,
      allDay: event.all_day,
      location: event.location ?? '',
      description: event.description ?? '',
    };
  }
  return {
    title: '',
    sourceId: defaultSourceId ?? sources[0]?.id ?? '',
    date: defaultDate ?? today(),
    startTime: '10:00',
    endTime: '11:00',
    allDay: false,
    location: '',
    description: '',
  };
}

function EventForm({
  onOpenChange,
  sources,
  event,
  defaultSourceId,
  defaultDate,
}: {
  onOpenChange: (open: boolean) => void;
  sources: Source[];
  event?: CalendarEvent | null;
  defaultSourceId?: string;
  defaultDate?: string | null;
}) {
  const queryClient = useQueryClient();
  const timezone = useAuthStore((s) => s.user?.timezone ?? 'UTC');
  const [form, setForm] = useState<FormValues>(() =>
    initialForm(event, sources, defaultSourceId, defaultDate),
  );
  const [error, setError] = useState<string | null>(null);

  const { data: history = [] } = useQuery({
    queryKey: ['history', event?.id],
    queryFn: () => fetchEventHistory(event?.id as string),
    enabled: Boolean(event?.id) && !event?.busy,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const startAt = new Date(
        `${form.date}T${form.allDay ? '00:00' : form.startTime}`,
      );
      const endAt = new Date(
        `${form.date}T${form.allDay ? '23:59' : form.endTime}`,
      );
      if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
        throw new Error('Некорректная дата');
      }
      if (!form.allDay && endAt <= startAt) {
        throw new Error('Время окончания раньше начала');
      }
      const payload = {
        title: form.title.trim(),
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        all_day: form.allDay,
        timezone,
        location: form.location.trim() || null,
        description: form.description.trim() || null,
      };
      if (event) {
        return updateEvent(event.id, payload);
      }
      return createEvent(form.sourceId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      onOpenChange(false);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить');
    },
  });

  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <>
      <DialogTitle>{event ? 'Событие' : 'Новое событие'}</DialogTitle>
      <DialogDescription>
        {event ? 'Измените детали события.' : 'Опишите событие и время.'}
      </DialogDescription>

      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          if (!form.title.trim()) {
            setError('Введите название');
            return;
          }
          if (!form.sourceId) {
            setError('Выберите источник');
            return;
          }
          mutation.mutate();
        }}
      >
        <div className="space-y-1">
          <Label htmlFor="event-title">Название</Label>
          <Input
            id="event-title"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            autoFocus
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="event-source">Источник</Label>
          <select
            id="event-source"
            value={form.sourceId}
            onChange={(e) => update('sourceId', e.target.value)}
            disabled={Boolean(event)}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent disabled:opacity-60"
          >
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="event-date">Дата</Label>
            <Input
              id="event-date"
              type="date"
              value={form.date}
              onChange={(e) => update('date', e.target.value)}
            />
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={form.allDay}
              onChange={(e) => update('allDay', e.target.checked)}
              className="size-4 accent-[var(--accent)]"
            />
            Весь день
          </label>
        </div>

        {!form.allDay && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="event-start">Начало</Label>
              <Input
                id="event-start"
                type="time"
                value={form.startTime}
                onChange={(e) => update('startTime', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="event-end">Окончание</Label>
              <Input
                id="event-end"
                type="time"
                value={form.endTime}
                onChange={(e) => update('endTime', e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="event-location">Место</Label>
          <Input
            id="event-location"
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="event-description">Описание</Label>
          <textarea
            id="event-description"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
          />
        </div>

        {event && history.length > 0 && (
          <div className="space-y-2 border-t border-border pt-4">
            <Label>История</Label>
            <ul className="space-y-1">
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between text-xs text-muted"
                >
                  <span>
                    {ACTION_LABELS[entry.action]} · {entry.user.name}
                  </span>
                  <span>{new Date(entry.created_at).toLocaleString('ru-RU')}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && <p className="text-xs text-conflict">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {event ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      </form>
    </>
  );
}

export function EventDialog({
  open,
  onOpenChange,
  sources,
  event,
  defaultSourceId,
  defaultDate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sources: Source[];
  event?: CalendarEvent | null;
  defaultSourceId?: string;
  defaultDate?: string | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <EventForm
          key={`${event?.id ?? 'new'}:${defaultDate ?? ''}:${defaultSourceId ?? ''}`}
          onOpenChange={onOpenChange}
          sources={sources}
          event={event}
          defaultSourceId={defaultSourceId}
          defaultDate={defaultDate}
        />
      </DialogContent>
    </Dialog>
  );
}
