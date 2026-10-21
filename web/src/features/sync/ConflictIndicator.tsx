import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { fetchConflicts } from '@/lib/services';

/**
 * Бейдж в шапке со счётчиком неразрешённых конфликтов синхронизации.
 * Показывается только при наличии конфликтов.
 */
export function ConflictIndicator() {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ['sync-conflicts'],
    queryFn: () => fetchConflicts(),
    staleTime: 30_000,
  });

  const count = data?.items.length ?? 0;
  if (count === 0) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => navigate('/sync/conflicts')}
      aria-label={`Конфликты синхронизации: ${count}`}
      title="Конфликты синхронизации"
      className={cn(
        'conflict-indicator inline-flex items-center gap-1.5 rounded-full',
        'bg-danger-muted px-2 py-1 text-caption text-danger',
        'transition-colors duration-150 hover:bg-danger-muted/70',
        'focus-visible:outline-none focus-visible:shadow-focus',
      )}
    >
      <AlertTriangle className="size-3.5" aria-hidden />
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
