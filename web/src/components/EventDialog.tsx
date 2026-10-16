import { Controller, useForm, useWatch } from 'react-hook-form';
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
import { Field } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
        className="mt-6 space-y-5"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
      >
        <Field label="Название" htmlFor="event-title" error={errors.title?.message}>
          <Input
            id="event-title"
            autoFocus
            placeholder="Встреча с командой"
            error={Boolean(errors.title)}
            {...register('title')}
          />
        </Field>

        <Field
          label="Источник"
          htmlFor="event-source"
          error={errors.sourceId?.message}
        >
          <Select
            id="event-source"
            disabled={Boolean(event)}
            error={Boolean(errors.sourceId)}
            {...register('sourceId')}
          >
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Дата" htmlFor="event-date" error={errors.date?.message}>
            <Input
              id="event-date"
              type="date"
              error={Boolean(errors.date)}
              {...register('date')}
            />
          </Field>
          <div className="flex items-center justify-between self-end pb-2.5">
            <Label htmlFor="event-allday">Весь день</Label>
            <Controller
              control={control}
              name="allDay"
              render={({ field }) => (
                <Switch
                  id="event-allday"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        </div>

        {!allDay && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Начало" htmlFor="event-start">
              <Input id="event-start" type="time" {...register('startTime')} />
            </Field>
            <Field
              label="Окончание"
              htmlFor="event-end"
              error={errors.endTime?.message}
            >
              <Input
                id="event-end"
                type="time"
                error={Boolean(errors.endTime)}
                {...register('endTime')}
              />
            </Field>
          </div>
        )}

        <Field label="Место" htmlFor="event-location">
          <Input
            id="event-location"
            placeholder="Офис, Zoom, адрес…"
            {...register('location')}
          />
        </Field>

        <Field label="Описание" htmlFor="event-description">
          <Textarea
            id="event-description"
            rows={3}
            placeholder="Добавьте детали…"
            {...register('description')}
          />
        </Field>

        {event && history.length > 0 && (
          <div className="space-y-2 border-t border-border pt-4">
            <Label>История</Label>
            <ul className="space-y-1">
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between text-caption text-text-muted"
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
          <p className="text-caption text-danger">
            Не удалось сохранить изменения
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          {event && canDelete && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={removeMutation.isPending}
              onClick={() => removeMutation.mutate()}
            >
              Удалить
            </Button>
          )}
          <div className="ml-auto flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              loading={isSubmitting || mutation.isPending}
            >
              {event ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
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
