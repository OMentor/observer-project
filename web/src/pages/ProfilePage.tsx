import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Check, Cloud, Link2, Moon, Sun } from 'lucide-react';
import { activateToken } from '@/lib/services';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/auth';
import { useTheme } from '@/hooks/useTheme';
import { PRESETS, PRESET_HINTS, PRESET_LABELS } from '@/lib/presets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PROVIDERS = [
  { id: 'yandex', label: 'Яндекс.Календарь' },
  { id: 'mailru', label: 'Mail.ru Календарь' },
  { id: 'apple', label: 'Apple iCloud' },
  { id: 'google', label: 'Google Calendar' },
  { id: 'microsoft', label: 'Microsoft Outlook' },
];

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const { theme, setTheme } = useTheme();

  return (
    <section className="max-w-3xl space-y-6">
      <h1 className="font-serif text-h1 text-text-primary">Профиль</h1>

      <div className="space-y-4 rounded-lg bg-bg-surface p-5 shadow-card">
        <h2 className="font-serif text-h3 text-text-primary">Аккаунт</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Имя</Label>
            <Input value={user?.name ?? ''} disabled />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input value={user?.email ?? ''} disabled />
          </div>
          <div className="space-y-1">
            <Label>Роль</Label>
            <Input
              value={user?.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}
              disabled
            />
          </div>
          <div className="space-y-1">
            <Label>Часовой пояс</Label>
            <Input value={user?.timezone ?? 'UTC'} disabled />
          </div>
        </div>
        <p className="text-caption text-text-muted">
          Редактирование аккаунта появится позже.
        </p>
      </div>

      <div className="space-y-4 rounded-lg bg-bg-surface p-5 shadow-card">
        <h2 className="font-serif text-h3 text-text-primary">Оформление</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors',
              theme === 'light'
                ? 'border-accent text-accent'
                : 'border-border text-muted hover:text-text',
            )}
          >
            <Sun className="size-4" />
            Светлая
            {theme === 'light' && <Check className="size-4" />}
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors',
              theme === 'dark'
                ? 'border-accent text-accent'
                : 'border-border text-muted hover:text-text',
            )}
          >
            <Moon className="size-4" />
            Тёмная
            {theme === 'dark' && <Check className="size-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-4 rounded-lg bg-bg-surface p-5 shadow-card">
        <div>
          <h2 className="font-serif text-h3 text-text-primary">
            Внешние подключения
          </h2>
          <p className="mt-1 text-body-sm text-text-secondary">
            Синхронизация календарей появится на следующем этапе.
          </p>
        </div>
        <div className="space-y-2">
          {PROVIDERS.map((provider) => (
            <div
              key={provider.id}
              className="flex items-center gap-3 rounded-lg border border-border px-4 py-3"
            >
              <Cloud className="size-4 text-muted" />
              <span className="text-body text-text-primary">{provider.label}</span>
              <span className="ml-auto rounded-full bg-bg px-2 py-0.5 text-caption text-text-muted">
                Скоро
              </span>
              <Button size="sm" variant="outline" disabled>
                <Link2 className="size-4" />
                Подключить
              </Button>
            </div>
          ))}
        </div>
      </div>

      <ActivateCard />
    </section>
  );
}

function ActivateCard() {
  const [params] = useSearchParams();
  const [token, setToken] = useState(params.get('token') ?? '');
  const [result, setResult] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => activateToken(token.trim(), {}),
    onSuccess: (data) =>
      setResult(`Пространство присоединено · ${PRESET_LABELS[data.preset]}`),
    onError: () => setResult('Не удалось активировать токен'),
  });

  return (
    <div className="space-y-4 rounded-lg bg-bg-surface p-5 shadow-card">
      <div>
        <h2 className="font-serif text-h3 text-text-primary">Активация токена</h2>
        <p className="mt-1 text-body-sm text-text-secondary">
          Введите токен доступа, чтобы присоединиться к пространству.
        </p>
      </div>
      <div className="flex gap-2">
        <Input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Вставьте токен"
        />
        <Button
          disabled={!token.trim() || mutation.isPending}
          onClick={() => {
            setResult(null);
            mutation.mutate();
          }}
        >
          Активировать
        </Button>
      </div>
      {result && <p className="text-body-sm text-text-secondary">{result}</p>}
      <div className="grid gap-2 sm:grid-cols-2">
        {PRESETS.map((preset) => (
          <div
            key={preset}
            className="rounded-lg border border-border px-3 py-2 text-xs"
          >
            <span className="font-medium text-text">
              {PRESET_LABELS[preset]}
            </span>
            <p className="mt-0.5 text-muted">{PRESET_HINTS[preset]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
