import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { activateToken } from '@/lib/services';
import { useAuthStore } from '@/store/auth';
import { PRESET_LABELS } from '@/lib/presets';
import type { TokenActivation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function errorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)
      ?.message;
    if (typeof message === 'string') {
      return message;
    }
    if (error.response?.status === 409) {
      return 'Этот токен уже использован.';
    }
    if (error.response?.status === 404) {
      return 'Токен не найден.';
    }
  }
  return 'Не удалось активировать токен.';
}

export function ActivatePage() {
  const { token = '' } = useParams();
  const user = useAuthStore((s) => s.user);
  const [name, setName] = useState(user?.name ?? '');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation<TokenActivation, unknown, void>({
    mutationFn: () =>
      activateToken(token, { name: name.trim() || undefined }),
    onError: (err) => setError(errorMessage(err)),
  });

  return (
    <section className="mx-auto max-w-md space-y-6 py-8">
      <div>
        <h1 className="font-serif text-3xl text-text">Приглашение</h1>
        <p className="mt-1 text-sm text-muted">
          Активация токена доступа к пространству.
        </p>
      </div>

      {mutation.isSuccess ? (
        <div className="space-y-4 rounded-xl border border-accent/40 bg-accent/5 p-6">
          <div className="flex items-center gap-2 text-text">
            <CheckCircle2 className="size-5 text-accent" />
            Готово! Вы присоединились к пространству.
          </div>
          <p className="text-sm text-muted">
            Ваш пресет: {PRESET_LABELS[mutation.data.preset]}.
          </p>
          <div className="flex gap-2">
            <Button asChild>
              <Link to={`/spaces/${mutation.data.space_id}`}>К пространству</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/calendar">В календарь</Link>
            </Button>
          </div>
        </div>
      ) : (
        <form
          className="space-y-4 rounded-xl border border-border bg-surface p-6"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            mutation.mutate();
          }}
        >
          {user && (
            <p className="text-sm text-muted">
              Вы вошли как <span className="text-text">{user.email}</span>.
            </p>
          )}
          <div className="space-y-1">
            <Label htmlFor="activate-name">Ваше имя</Label>
            <Input
              id="activate-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Как вас показывать участникам"
            />
          </div>

          {error && <p className="text-xs text-conflict">{error}</p>}

          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Активация…' : 'Активировать'}
          </Button>
        </form>
      )}
    </section>
  );
}
