import { cn } from '@/lib/cn';
import type { DiffRow } from './format';

/** Одна строка сравнения «поле / наша версия / внешняя версия». */
export function ConflictFieldDiff({ row }: { row: DiffRow }) {
  return (
    <tr className={cn(row.changed && 'bg-amber-muted/50')}>
      <th
        scope="row"
        className="py-2 pr-3 text-left align-top text-caption font-medium uppercase tracking-wide text-text-muted"
      >
        {row.label}
      </th>
      <td className="py-2 pr-3 align-top text-body-sm text-text-primary">
        {row.local}
      </td>
      <td className="py-2 align-top text-body-sm text-text-primary">
        {row.external}
      </td>
    </tr>
  );
}
