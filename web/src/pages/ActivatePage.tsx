import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { activateToken } from '@/lib/services';
import { useAuthStore } from '@/store/auth';
import type { TokenActivation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { PresetBadge } from '@/components/ui/preset-badge';

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
    mutationFn: () => activateToken(token, { name: name.trim() || undefined }),
    onError: (err) => setError(errorMessage(err)),
  });

  return (
    <section className="mx-auto max-w-md space-y-6 py-8">
      <div>
        <h1 className="font-serif text-h1 text-text-primary">Приглашение</h1>
        <p className="mt-1 text-body-sm text-text-secondary">
          Активация токена доступа к пространству.
        </p>
      </div>

      {mutation.isSuccess ? (
        <div className="space-y-4 rounded-lg border border-success/40 bg-success-muted p-6 shadow-card">
          <div className="flex items-center gap-2 text-text-primary">
            <CheckCircle2 className="size-5 text-success" />
            Готово! Вы присоединились к пространству.
          </div>
          <div className="flex items-center gap-2 text-body-sm text-text-secondary">
            Ваш пресет: <PresetBadge preset={mutation.data.preset} />
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link to={`/spaces/${mutation.data.space_id}`}>
                К пространству
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/calendar">В календарь</Link>
            </Button>
          </div>
        </div>
      ) : (
        <form
          className="space-y-5 rounded-lg bg-bg-surface p-6 shadow-card"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            mutation.mutate();
          }}
        >
          {user && (
            <p className="text-body-sm text-text-secondary">
              Вы вошли как{' '}
              <span className="text-text-primary">{user.email}</span>.
            </p>
          )}
          <Field
            label="Ваше имя"
            htmlFor="activate-name"
            helper="Как вас показывать участникам"
          >
            <Input
              id="activate-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Как вас показывать участникам"
            />
          </Field>

          {error && <p className="text-caption text-danger">{error}</p>}

          <Button
            type="submit"
            className="w-full"
            loading={mutation.isPending}
          >
            {mutation.isPending ? 'Активация…' : 'Активировать'}
          </Button>
        </form>
      )}
    </section>
  );
}
