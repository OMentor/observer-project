import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ConflictCard } from '@/features/sync/ConflictCard';
import { ConflictResolveDialog } from '@/features/sync/ConflictResolveDialog';
import { fetchConflicts, fetchSpaces } from '@/lib/services';
import type { Conflict } from '@/lib/types';

export function ConflictsPage() {
  const [selected, setSelected] = useState<Conflict | null>(null);

  const conflicts = useQuery({
    queryKey: ['sync-conflicts'],
    queryFn: () => fetchConflicts(),
  });
  const spaces = useQuery({ queryKey: ['spaces'], queryFn: fetchSpaces });

  const sourceLabels = new Map<string, string>();
  for (const space of spaces.data ?? []) {
    for (const source of space.sources ?? []) {
      sourceLabels.set(source.id, `${space.name} / ${source.name}`);
    }
  }

  const items = conflicts.data?.items ?? [];

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-h1 text-text-primary">
            Конфликты синхронизации
          </h1>
          <p className="mt-1 text-body-sm text-text-secondary">
            Встречи, изменённые и у вас, и во внешнем календаре. Выберите, какую
            версию оставить.
          </p>
        </div>
        {conflicts.data && (
          <span className="text-caption text-text-muted">
            {items.length} шт.
          </span>
        )}
      </header>

      {conflicts.isLoading ? (
        <div className="space-y-3" aria-hidden>
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : conflicts.isError ? (
        <EmptyState
          title="Не удалось загрузить конфликты"
          description="Проверьте соединение и попробуйте обновить страницу."
        />
      ) : items.length > 0 ? (
        <div className="space-y-3">
          {items.map((conflict) => (
            <ConflictCard
              key={conflict.id}
              conflict={conflict}
              sourceLabel={sourceLabels.get(conflict.event.source_id)}
              onResolve={setSelected}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<ShieldCheck className="size-6" />}
          title="Нет конфликтов"
          description="Все изменения синхронизированы с внешними календарями."
        />
      )}

      <ConflictResolveDialog
        conflict={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
          }
        }}
      />
    </section>
  );
}
