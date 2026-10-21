import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Conflict } from '@/lib/types';
import { ConflictFieldDiff } from './ConflictFieldDiff';
import { buildDiff, formatText } from './format';

export interface ConflictCardProps {
  conflict: Conflict;
  sourceLabel?: string;
  onResolve: (conflict: Conflict) => void;
}

/** Карточка конфликта в списке: заголовок, мета и краткий diff. */
export function ConflictCard({
  conflict,
  sourceLabel,
  onResolve,
}: ConflictCardProps) {
  const changed = buildDiff(
    conflict.local_data,
    conflict.external_data,
  ).filter((row) => row.changed);

  return (
    <Card className="space-y-4" data-testid="conflict-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-serif text-h4 text-text-primary">
            {formatText(conflict.event.title)}
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-text-secondary">
            <Badge tone="danger" icon={<AlertTriangle className="size-3" />}>
              Конфликт
            </Badge>
            {sourceLabel && <span className="truncate">{sourceLabel}</span>}
            <span aria-hidden>·</span>
            <time dateTime={conflict.created_at}>
              {new Date(conflict.created_at).toLocaleString('ru-RU')}
            </time>
          </div>
        </div>
        <Button size="sm" onClick={() => onResolve(conflict)}>
          Разрешить
        </Button>
      </div>

      {changed.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-caption uppercase tracking-wide text-text-muted">
                <th className="py-1 pr-3 font-medium">Поле</th>
                <th className="py-1 pr-3 font-medium">Наша версия</th>
                <th className="py-1 font-medium">Внешняя версия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {changed.map((row) => (
                <ConflictFieldDiff key={row.key} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-body-sm text-text-secondary">
          Различий в отображаемых полях нет.
        </p>
      )}
    </Card>
  );
}
