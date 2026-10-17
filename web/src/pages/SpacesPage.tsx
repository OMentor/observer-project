import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { LayoutGrid, Plus, Trash2 } from 'lucide-react';
import { createSpace, deleteSpace, fetchSpaces } from '@/lib/services';
import { useAuthStore } from '@/store/auth';
import { colorForName } from '@/lib/palette';
import {
  buildOnboardingSteps,
  dismissOnboarding,
  isOnboardingComplete,
  isOnboardingDismissed,
} from '@/lib/onboarding';
import { useOnboardingProgress } from '@/hooks/useOnboarding';
import { OnboardingChecklist } from '@/features/onboarding/OnboardingChecklist';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
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
  const [onboardingDismissed, setOnboardingDismissed] = useState(() =>
    isOnboardingDismissed(),
  );

  const { data: spaces = [], isLoading } = useQuery({
    queryKey: ['spaces'],
    queryFn: fetchSpaces,
  });

  const onboarding = useOnboardingProgress();
  const onboardingSteps = buildOnboardingSteps(onboarding);
  const showOnboarding =
    !onboarding.isLoading &&
    onboarding.spacesCount > 0 &&
    !onboardingDismissed &&
    !isOnboardingComplete(onboardingSteps);

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
          <h1 className="font-serif text-h1 text-text-primary">Пространства</h1>
          <p className="mt-1 text-body-sm text-text-secondary">
            Группы источников и участников.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Создать
        </Button>
      </div>

      {showOnboarding && (
        <OnboardingChecklist
          steps={onboardingSteps}
          onCreateSpace={() => setOpen(true)}
          onDismiss={() => {
            dismissOnboarding();
            setOnboardingDismissed(true);
          }}
        />
      )}

      {isLoading ? (
        <p className="text-body-sm text-text-secondary">Загрузка…</p>
      ) : spaces.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid className="size-5" />}
          title="Пока нет пространств"
          description="Создайте первое пространство, чтобы добавлять источники и приглашать участников."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              Создать пространство
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {spaces.map((space, index) => (
            <Card
              key={space.id}
              interactive
              data-testid="space-card"
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'backwards' }}
            >
              <Link to={`/spaces/${space.id}`} className="block">
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-md"
                    style={{
                      background: `${colorForName(space.name)}33`,
                    }}
                  >
                    <span
                      className="size-3 rounded-full"
                      style={{ background: colorForName(space.name) }}
                    />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-h4 text-text-primary">
                      {space.name}
                    </h2>
                    <p className="text-body-sm text-text-secondary">
                      Источников: {space.sources?.length ?? 0}
                    </p>
                  </div>
                </div>
              </Link>
              {space.owner_id === currentUserId && (
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(space.id)}
                  className="mt-4 inline-flex items-center gap-1 text-caption text-text-muted transition-colors hover:text-danger"
                >
                  <Trash2 className="size-3.5" />
                  Удалить
                </button>
              )}
            </Card>
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
            className="mt-6 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) {
                createMutation.mutate(name.trim());
              }
            }}
          >
            <Field label="Название" htmlFor="space-name">
              <Input
                id="space-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </Field>
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                loading={createMutation.isPending}
                disabled={!name.trim()}
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
