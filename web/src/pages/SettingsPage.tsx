import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Trash2 } from 'lucide-react';
import {
  deleteSource,
  fetchSpace,
  fetchSpaces,
  updateSource,
  updateSpace,
} from '@/lib/services';
import { cn } from '@/lib/cn';
import { PALETTE } from '@/lib/palette';
import { useSpaceAccess } from '@/hooks/access';
import type { Source, Visibility } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SpacePicker } from '@/components/SpacePicker';

export function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const [spaceId, setSpaceId] = useState(params.get('space') ?? '');

  const { data: spaces = [] } = useQuery({
    queryKey: ['spaces'],
    queryFn: fetchSpaces,
  });

  const selectedSpaceId = spaceId || spaces[0]?.id || '';

  const { isFull } = useSpaceAccess(selectedSpaceId || undefined);

  const { data: space } = useQuery({
    queryKey: ['space', selectedSpaceId],
    queryFn: () => fetchSpace(selectedSpaceId),
    enabled: Boolean(selectedSpaceId),
  });

  const selectSpace = (id: string) => {
    setSpaceId(id);
    setParams({ space: id }, { replace: true });
  };

  if (spaces.length === 0) {
    return (
      <section className="space-y-4">
        <h1 className="font-serif text-3xl text-text">Настройки</h1>
        <div className="rounded-xl border border-dashed border-border bg-surface/40 p-10 text-center text-sm text-muted">
          Создайте пространство, чтобы управлять его настройками.
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl text-text">Настройки пространства</h1>
        <SpacePicker
          spaces={spaces}
          value={selectedSpaceId}
          onChange={selectSpace}
        />
      </div>

      {!isFull && (
        <p className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-muted">
          Изменение доступно только владельцу пространства (пресет «Полный»).
        </p>
      )}

      {space && (
        <SpaceNameForm
          key={space.id}
          spaceId={space.id}
          initialName={space.name}
          isFull={isFull}
        />
      )}

      <div className="space-y-3">
        <h2 className="font-serif text-xl text-text">Источники</h2>
        {space && space.sources && space.sources.length > 0 ? (
          <div className="space-y-2">
            {space.sources.map((source) => (
              <SourceRow
                key={source.id}
                source={source}
                editable={isFull}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-surface/40 p-8 text-center text-sm text-muted">
            Источников пока нет. Добавьте их на странице пространства.
          </div>
        )}
      </div>
    </section>
  );
}

function SpaceNameForm({
  spaceId,
  initialName,
  isFull,
}: {
  spaceId: string;
  initialName: string;
  isFull: boolean;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(initialName);

  const renameMutation = useMutation({
    mutationFn: () => updateSpace(spaceId, name.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space', spaceId] });
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
    },
  });

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <div className="space-y-1">
        <Label htmlFor="space-name">Название пространства</Label>
        <div className="flex gap-2">
          <Input
            id="space-name"
            value={name}
            disabled={!isFull}
            onChange={(e) => setName(e.target.value)}
          />
          <Button
            disabled={
              !isFull ||
              renameMutation.isPending ||
              !name.trim() ||
              name.trim() === initialName
            }
            onClick={() => renameMutation.mutate()}
          >
            Сохранить
          </Button>
        </div>
      </div>
    </div>
  );
}

function SourceRow({
  source,
  editable,
}: {
  source: Source;
  editable: boolean;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(source.name);
  const [color, setColor] = useState(source.color);
  const [visibility, setVisibility] = useState<Visibility>(source.visibility);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['space', source.space_id] });
    queryClient.invalidateQueries({ queryKey: ['spaces'] });
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      updateSource(source.id, {
        name: name.trim(),
        color,
        visibility,
      }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteSource(source.id),
    onSuccess: invalidate,
  });

  const dirty =
    name.trim() !== source.name ||
    color !== source.color ||
    visibility !== source.visibility;

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              disabled={!editable}
              onClick={() => setColor(c)}
              className={cn(
                'size-6 rounded-full border-2 transition-transform',
                color === c ? 'scale-110 border-text' : 'border-transparent',
                !editable && 'cursor-not-allowed opacity-60',
              )}
              style={{ backgroundColor: c }}
              aria-label={`Цвет ${c}`}
            />
          ))}
        </div>
        <Input
          value={name}
          disabled={!editable}
          onChange={(e) => setName(e.target.value)}
          className="max-w-xs flex-1"
        />
        <select
          value={visibility}
          disabled={!editable}
          onChange={(e) => setVisibility(e.target.value as Visibility)}
          className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent disabled:opacity-60"
        >
          <option value="SHARED">Общий</option>
          <option value="PRIVATE">Личный</option>
        </select>

        <div className="ml-auto flex gap-2">
          {editable && (
            <>
              <Button
                size="sm"
                disabled={!dirty || !name.trim() || saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                <Check className="size-4" />
                Сохранить
              </Button>
              <Button
                size="icon"
                variant="ghost"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
                aria-label="Удалить источник"
                className="hover:text-conflict"
              >
                <Trash2 className="size-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
