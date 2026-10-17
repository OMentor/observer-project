import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useSyncStore } from '@/store/sync';

/**
 * Индикатор ошибки синхронизации с сервером.
 *
 * Показывает пульсирующий бейдж (класс .conflict-indicator) при потере
 * соединения с API. Как только любой запрос данных снова отрабатывает
 * успешно, индикатор скрывается. На этапе подключения внешних календарей
 * (Этап 6) этот же индикатор будет отражать ошибки синхронизации источников.
 */
export function SyncIndicator() {
  const status = useSyncStore((s) => s.status);

  if (status === 'idle') {
    return null;
  }

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label="Ошибка синхронизации"
      title="Не удалось синхронизироваться с сервером"
      className={cn(
        'conflict-indicator inline-flex items-center gap-1.5 rounded-full',
        'bg-danger-muted px-2 py-1 text-caption text-danger',
      )}
    >
      <AlertTriangle className="size-3.5" aria-hidden />
      <span className="hidden sm:inline">Ошибка синхронизации</span>
    </span>
  );
}
