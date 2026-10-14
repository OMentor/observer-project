import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, KeyRound, Plus, Users } from 'lucide-react';
import { createSource, fetchSpace } from '@/lib/services';
import { cn } from '@/lib/cn';
import { PRESET_LABELS } from '@/lib/presets';
import { useSpaceAccess } from '@/hooks/access';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

const PALETTE = [
  '#5B5FEF',
  '#F0A030',
  '#34C77B',
  '#E05C4A',
  '#8B5CF6',
  '#0EA5E9',
];

export function SpacePage() {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const { preset, isFull } = useSpaceAccess(id);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PALETTE[0]);

  const { data: space, isLoading } = useQuery({
    queryKey: ['space', id],
    queryFn: () => fetchSpace(id),
    enabled: Boolean(id),
  });

  const createMutation = useMutation({
    mutationFn: () => createSource(id, { name: name.trim(), color }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space', id] });
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      setOpen(false);
      setName('');
      setColor(PALETTE[0]);
    },
  });

  return (
    <section className="space-y-6">
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-text"
        >
          <ArrowLeft className="size-4" />
          Все пространства
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl text-text">
              {isLoading ? 'Загрузка…' : space?.name}
            </h1>
            {preset && (
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
                {PRESET_LABELS[preset]}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/calendar">Открыть календарь</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/members?space=${id}`}>
                <Users className="size-4" />
                Участники
              </Link>
            </Button>
            {isFull && (
              <>
                <Button variant="outline" asChild>
                  <Link to={`/tokens?space=${id}`}>
                    <KeyRound className="size-4" />
                    Токены
                  </Link>
                </Button>
                <Button onClick={() => setOpen(true)}>
                  <Plus className="size-4" />
                  Источник
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {space && space.sources && space.sources.length > 0 ? (
        <div className="space-y-2">
          {space.sources.map((source) => (
            <div
              key={source.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
            >
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: source.color }}
              />
              <span className="text-text">{source.name}</span>
              <span className="ml-auto text-xs text-muted">
                {source.visibility === 'PRIVATE' ? 'Личный' : 'Общий'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface/40 p-10 text-center text-sm text-muted">
          В этом пространстве пока нет источников.
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Новый источник</DialogTitle>
          <DialogDescription>
            Источник — это отдельный календарь внутри пространства.
          </DialogDescription>
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) {
                createMutation.mutate();
              }
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="source-name">Название</Label>
              <Input
                id="source-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Цвет</Label>
              <div className="flex gap-2">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      'size-7 rounded-full border-2 transition-transform',
                      color === c
                        ? 'scale-110 border-text'
                        : 'border-transparent',
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Цвет ${c}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || !name.trim()}
              >
                Создать
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
