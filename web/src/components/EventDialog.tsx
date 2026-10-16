import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createEvent,
  deleteEvent,
  fetchEventHistory,
  updateEvent,
} from '@/lib/services';
import { useAuthStore } from '@/store/auth';
import type { CalendarEvent, EventHistoryEntry, Source } from '@/lib/types';
import { eventFormSchema, type EventFormValues } from '@/lib/event-schema';
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

function initialValues(
  event: CalendarEvent | null | undefined,
  sources: Source[],
  defaultSourceId: string | undefined,
  defaultDate: string | null | undefined,
): EventFormValues {
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
  canDelete,
}: {
  onOpenChange: (open: boolean) => void;
  sources: Source[];
  event?: CalendarEvent | null;
  defaultSourceId?: string;
  defaultDate?: string | null;
  canDelete?: boolean;
}) {
  const queryClient = useQueryClient();
  const timezone = useAuthStore((s) => s.user?.timezone ?? 'UTC');
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: initialValues(event, sources, defaultSourceId, defaultDate),
  });

  const allDay = useWatch({ control, name: 'allDay' });

  const { data: history = [] } = useQuery({
    queryKey: ['history', event?.id],
    queryFn: () => fetchEventHistory(event?.id as string),
    enabled: Boolean(event?.id) && !event?.busy,
  });

  const mutation = useMutation({
    mutationFn: async (values: EventFormValues) => {
      const startAt = new Date(
        `${values.date}T${values.allDay ? '00:00' : values.startTime}`,
      );
      const endAt = new Date(
        `${values.date}T${values.allDay ? '23:59' : values.endTime}`,
      );
      const payload = {
        title: values.title.trim(),
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        all_day: values.allDay,
        timezone,
        location: values.location.trim() || null,
        description: values.description.trim() || null,
      };
      if (event) {
        return updateEvent(event.id, payload);
      }
      return createEvent(values.sourceId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event-page'] });
      onOpenChange(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => deleteEvent(event?.id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event-page'] });
      onOpenChange(false);
    },
  });

  return (
    <>
      <DialogTitle>{event ? 'Событие' : 'Новое событие'}</DialogTitle>
      <DialogDescription>
        {event ? 'Измените детали события.' : 'Опишите событие и время.'}
      </DialogDescription>

      <form
        className="mt-4 space-y-4"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
      >
        <div className="space-y-1">
          <Label htmlFor="event-title">Название</Label>
          <Input id="event-title" autoFocus {...register('title')} />
          {errors.title && (
            <p className="text-xs text-conflict">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="event-source">Источник</Label>
          <select
            id="event-source"
            disabled={Boolean(event)}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent disabled:opacity-60"
            {...register('sourceId')}
          >
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </select>
          {errors.sourceId && (
            <p className="text-xs text-conflict">{errors.sourceId.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="event-date">Дата</Label>
            <Input id="event-date" type="date" {...register('date')} />
            {errors.date && (
              <p className="text-xs text-conflict">{errors.date.message}</p>
            )}
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm text-muted">
            <input
              type="checkbox"
              className="size-4 accent-[var(--accent)]"
              {...register('allDay')}
            />
            Весь день
          </label>
        </div>

        {!allDay && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="event-start">Начало</Label>
              <Input id="event-start" type="time" {...register('startTime')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="event-end">Окончание</Label>
              <Input id="event-end" type="time" {...register('endTime')} />
              {errors.endTime && (
                <p className="text-xs text-conflict">{errors.endTime.message}</p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="event-location">Место</Label>
          <Input id="event-location" {...register('location')} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="event-description">Описание</Label>
          <textarea
            id="event-description"
            rows={3}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
            {...register('description')}
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
                  <span>
                    {new Date(entry.created_at).toLocaleString('ru-RU')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(mutation.isError || removeMutation.isError) && (
          <p className="text-xs text-conflict">
            Не удалось сохранить изменения
          </p>
        )}

        <div className="flex justify-end gap-2">
          {event && canDelete && (
            <Button
              type="button"
              variant="danger"
              className="mr-auto"
              disabled={removeMutation.isPending}
              onClick={() => removeMutation.mutate()}
            >
              Удалить
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending}>
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
  canDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sources: Source[];
  event?: CalendarEvent | null;
  defaultSourceId?: string;
  defaultDate?: string | null;
  canDelete?: boolean;
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
          canDelete={canDelete}
        />
      </DialogContent>
    </Dialog>
  );
}
