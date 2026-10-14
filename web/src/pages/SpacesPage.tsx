import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { createSpace, deleteSpace, fetchSpaces } from '@/lib/services';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

export function SpacesPage() {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const { data: spaces = [], isLoading } = useQuery({
    queryKey: ['spaces'],
    queryFn: fetchSpaces,
  });

  const createMutation = useMutation({
    mutationFn: createSpace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      setOpen(false);
      setName('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSpace,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['spaces'] }),
  });

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-text">Пространства</h1>
          <p className="mt-1 text-sm text-muted">
            Группы источников и участников.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Создать
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : spaces.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/40 p-10 text-center text-sm text-muted">
          Пока нет пространств. Создайте первое.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {spaces.map((space) => (
            <div
              key={space.id}
              className="group rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent/50"
            >
              <Link to={`/spaces/${space.id}`} className="block">
                <h2 className="text-lg font-medium text-text">{space.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  Источников: {space.sources?.length ?? 0}
                </p>
              </Link>
              {space.owner_id === currentUserId && (
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(space.id)}
                  className="mt-4 inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-conflict"
                >
                  <Trash2 className="size-3.5" />
                  Удалить
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Новое пространство</DialogTitle>
          <DialogDescription>
            Например: «Работа», «Личное», «Семья».
          </DialogDescription>
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) {
                createMutation.mutate(name.trim());
              }
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="space-name">Название</Label>
              <Input
                id="space-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
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
