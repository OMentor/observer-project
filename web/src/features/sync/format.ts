import type { EventSnapshot } from '@/lib/types';

const dateFmt = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
});

const timeFmt = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
});

/** Человекочитаемое время события. */
export function formatWhen(
  snapshot: Pick<EventSnapshot, 'start_at' | 'end_at' | 'all_day'>,
): string {
  const start = new Date(snapshot.start_at);
  const end = new Date(snapshot.end_at);
  if (snapshot.all_day) {
    return `Весь день · ${dateFmt.format(start)}`;
  }
  if (start.toDateString() === end.toDateString()) {
    return `${dateFmt.format(start)}, ${timeFmt.format(start)}–${timeFmt.format(end)}`;
  }
  return `${dateFmt.format(start)} ${timeFmt.format(start)} — ${dateFmt.format(end)} ${timeFmt.format(end)}`;
}

/** Пустые значения показываем прочерком. */
export function formatText(value: string | null | undefined): string {
  return value && value.trim().length > 0 ? value : '—';
}

export type DiffRow = {
  key: string;
  label: string;
  local: string;
  external: string;
  changed: boolean;
};

/** Сравнение локальной и внешней версий по полям, значимым для UI. */
export function buildDiff(
  local: EventSnapshot,
  external: EventSnapshot,
): DiffRow[] {
  const whenLocal = formatWhen(local);
  const whenExternal = formatWhen(external);
  return [
    {
      key: 'title',
      label: 'Название',
      local: formatText(local.title),
      external: formatText(external.title),
      changed: local.title !== external.title,
    },
    {
      key: 'when',
      label: 'Время',
      local: whenLocal,
      external: whenExternal,
      changed:
        local.start_at !== external.start_at ||
        local.end_at !== external.end_at ||
        local.all_day !== external.all_day,
    },
    {
      key: 'location',
      label: 'Место',
      local: formatText(local.location),
      external: formatText(external.location),
      changed: (local.location ?? '') !== (external.location ?? ''),
    },
    {
      key: 'description',
      label: 'Описание',
      local: formatText(local.description),
      external: formatText(external.description),
      changed: (local.description ?? '') !== (external.description ?? ''),
    },
  ];
}
