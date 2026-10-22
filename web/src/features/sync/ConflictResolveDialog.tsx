import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/cn';
import { getErrorStatus } from '@/lib/errors';
import { resolveConflict } from '@/lib/services';
import { useToastStore } from '@/store/toasts';
import type {
  Conflict,
  ConflictResolution,
  MergedEventData,
  ResolveConflictPayload,
} from '@/lib/types';
import { ConflictFieldDiff } from './ConflictFieldDiff';
import { buildDiff, formatWhen } from './format';

type Mode = 'preview' | 'merge';
type Choice = 'local' | 'external' | 'own';

interface ChoiceRowProps {
  name: string;
  label: string;
  localText: string;
  externalText: string;
  choice: Choice;
  onChoice: (choice: Choice) => void;
  own: string;
  onOwn: (value: string) => void;
  allowOwn?: boolean;
  multiline?: boolean;
}

function ChoiceRow({
  name,
  label,
  localText,
  externalText,
  choice,
  onChoice,
  own,
  onOwn,
  allowOwn = true,
  multiline = false,
}: ChoiceRowProps) {
  const options: { value: Choice; caption: string; text: string }[] = [
    { value: 'local', caption: 'Наша', text: localText },
    { value: 'external', caption: 'Внешняя', text: externalText },
  ];
  if (allowOwn) {
    options.push({ value: 'own', caption: 'Своё', text: own || '—' });
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-caption font-medium uppercase tracking-wide text-text-muted">
        {label}
      </legend>
      <div
        className={cn(
          'grid gap-2',
          allowOwn ? 'sm:grid-cols-3' : 'sm:grid-cols-2',
        )}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex cursor-pointer flex-col gap-1 rounded-md border p-2 transition-colors duration-150',
              choice === option.value
                ? 'border-accent bg-accent-muted/40'
                : 'border-border hover:bg-bg-elevated',
            )}
          >
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={choice === option.value}
                onChange={() => onChoice(option.value)}
                aria-label={`${label}: ${option.caption.toLowerCase()}`}
                className="size-3.5 accent-[var(--accent)]"
              />
              <span className="text-body-sm font-medium text-text-primary">
                {option.caption}
              </span>
            </span>
            <span
              className="truncate text-caption text-text-muted"
              title={option.text}
            >
              {option.text}
            </span>
          </label>
        ))}
      </div>
      {allowOwn && choice === 'own' && (
        <div className="pt-1">
          {multiline ? (
            <Textarea
              value={own}
              onChange={(event) => onOwn(event.target.value)}
              aria-label={`${label}: своё значение`}
              rows={2}
            />
          ) : (
            <Input
              value={own}
              onChange={(event) => onOwn(event.target.value)}
              aria-label={`${label}: своё значение`}
            />
          )}
        </div>
      )}
    </fieldset>
  );
}

interface MergeEditorProps {
  conflict: Conflict;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (merged: MergedEventData) => void;
}

function MergeEditor({
  conflict,
  pending,
  onCancel,
  onSubmit,
}: MergeEditorProps) {
  const local = conflict.local_data;
  const external = conflict.external_data;

  const [titleChoice, setTitleChoice] = useState<Choice>('local');
  const [titleOwn, setTitleOwn] = useState(local.title);
  const [descriptionChoice, setDescriptionChoice] = useState<Choice>('local');
  const [descriptionOwn, setDescriptionOwn] = useState(
    local.description ?? '',
  );
  const [timeChoice, setTimeChoice] = useState<'local' | 'external'>('local');
  const [locationChoice, setLocationChoice] = useState<Choice>('local');
  const [locationOwn, setLocationOwn] = useState(local.location ?? '');

  const startAt =
    timeChoice === 'external' ? external.start_at : local.start_at;
  const endAt = timeChoice === 'external' ? external.end_at : local.end_at;
  const timeError = new Date(endAt).getTime() < new Date(startAt).getTime();
  const titleError = titleChoice === 'own' && titleOwn.trim().length === 0;
  const invalid = timeError || titleError;

  function handleSave() {
    const merged: MergedEventData = {};
    if (titleChoice === 'external') merged.title = external.title;
    if (titleChoice === 'own') merged.title = titleOwn.trim();

    if (descriptionChoice === 'external') {
      merged.description = external.description;
    }
    if (descriptionChoice === 'own') {
      merged.description = descriptionOwn.trim() || null;
    }

    if (timeChoice === 'external') {
      merged.start_at = external.start_at;
      merged.end_at = external.end_at;
    }

    if (locationChoice === 'external') merged.location = external.location;
    if (locationChoice === 'own') {
      merged.location = locationOwn.trim() || null;
    }

    onSubmit(merged);
  }

  return (
    <div>
      <DialogTitle>Объединить правки</DialogTitle>
      <DialogDescription>
        Выберите значение для каждого поля. Время берётся целиком из одной
        версии.
      </DialogDescription>

      <div className="mt-6 space-y-5">
        <ChoiceRow
          name="conflict-title"
          label="Название"
          localText={local.title}
          externalText={external.title}
          choice={titleChoice}
          onChoice={setTitleChoice}
          own={titleOwn}
          onOwn={setTitleOwn}
        />
        <ChoiceRow
          name="conflict-description"
          label="Описание"
          localText={local.description ?? '—'}
          externalText={external.description ?? '—'}
          choice={descriptionChoice}
          onChoice={setDescriptionChoice}
          own={descriptionOwn}
          onOwn={setDescriptionOwn}
          multiline
        />
        <ChoiceRow
          name="conflict-time"
          label="Время"
          localText={formatWhen(local)}
          externalText={formatWhen(external)}
          choice={timeChoice}
          onChoice={(choice) => {
            if (choice === 'local' || choice === 'external') {
              setTimeChoice(choice);
            }
          }}
          own=""
          onOwn={() => undefined}
          allowOwn={false}
        />
        <ChoiceRow
          name="conflict-location"
          label="Место"
          localText={local.location ?? '—'}
          externalText={external.location ?? '—'}
          choice={locationChoice}
          onChoice={setLocationChoice}
          own={locationOwn}
          onOwn={setLocationOwn}
        />
      </div>

      {(titleError || timeError) && (
        <p className="mt-4 flex items-center gap-2 text-body-sm text-danger">
          <AlertTriangle className="size-4" aria-hidden />
          {titleError
            ? 'Название не может быть пустым.'
            : 'Конец события раньше начала.'}
        </p>
      )}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onCancel} disabled={pending}>
          <ArrowLeft className="size-4" />
          Назад
        </Button>
        <Button onClick={handleSave} loading={pending} disabled={invalid}>
          Сохранить
        </Button>
      </div>
    </div>
  );
}

interface ResolveBodyProps {
  conflict: Conflict;
  onClose: () => void;
}

function ResolveBody({ conflict, onClose }: ResolveBodyProps) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>('preview');

  const mutation = useMutation({
    mutationFn: (payload: ResolveConflictPayload) =>
      resolveConflict(conflict.id, payload),
    onSuccess: () => {
      useToastStore
        .getState()
        .push({ title: 'Конфликт разрешён', tone: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sync-conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['event-page'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      onClose();
    },
    onError: (error) => {
      const status = getErrorStatus(error);
      const push = useToastStore.getState().push;
      if (status === 409) {
        push({ title: 'Конфликт уже разрешён', tone: 'warning' });
        queryClient.invalidateQueries({ queryKey: ['sync-conflicts'] });
        onClose();
        return;
      }
      if (status === 403) {
        push({ title: 'Нет доступа', tone: 'danger' });
        return;
      }
      if (status === 503) {
        push({
          title: 'Не удалось записать изменения',
          description: 'Внешний календарь недоступен. Попробуйте ещё раз.',
          tone: 'danger',
        });
        return;
      }
      push({ title: 'Не удалось разрешить конфликт', tone: 'danger' });
    },
  });

  const pending = mutation.isPending;
  const resolving = (resolution: ConflictResolution) =>
    pending && mutation.variables?.resolution === resolution;

  if (mode === 'merge') {
    return (
      <MergeEditor
        conflict={conflict}
        pending={pending}
        onCancel={() => setMode('preview')}
        onSubmit={(merged) =>
          mutation.mutate({ resolution: 'merged', merged_data: merged })
        }
      />
    );
  }

  const rows = buildDiff(conflict.local_data, conflict.external_data);

  return (
    <div>
      <DialogTitle>Конфликт: «{conflict.event.title}»</DialogTitle>
      <DialogDescription>
        Одна и та же встреча изменена у вас и во внешнем календаре. Выберите,
        какую версию оставить.
      </DialogDescription>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-caption uppercase tracking-wide text-text-muted">
              <th className="py-2 pr-3 font-medium">Поле</th>
              <th className="py-2 pr-3 font-medium">Наша версия</th>
              <th className="py-2 font-medium">Внешняя версия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {rows.map((row) => (
              <ConflictFieldDiff key={row.key} row={row} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="ghost"
          onClick={() => setMode('merge')}
          disabled={pending}
        >
          Объединить
        </Button>
        <Button
          variant="secondary"
          onClick={() => mutation.mutate({ resolution: 'external' })}
          loading={resolving('external')}
          disabled={pending && !resolving('external')}
        >
          Внешняя версия
        </Button>
        <Button
          onClick={() => mutation.mutate({ resolution: 'local' })}
          loading={resolving('local')}
          disabled={pending && !resolving('local')}
        >
          Наша версия
        </Button>
      </div>
    </div>
  );
}

export interface ConflictResolveDialogProps {
  conflict: Conflict | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Модалка разрешения конфликта: предпросмотр diff и режим объединения. */
export function ConflictResolveDialog({
  conflict,
  open,
  onOpenChange,
}: ConflictResolveDialogProps) {
  return (
    <Dialog open={open && Boolean(conflict)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[720px]">
        {conflict && (
          <ResolveBody
            key={conflict.id}
            conflict={conflict}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
