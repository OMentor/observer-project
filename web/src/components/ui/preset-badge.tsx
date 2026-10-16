import type { Preset } from '@/lib/types';
import { Badge, type BadgeTone } from '@/components/ui/badge';

const PRESET_BADGE: Record<Preset, { label: string; tone: BadgeTone; icon: string }> =
  {
    FULL: { label: 'Полный', tone: 'success', icon: '●' },
    OWN: { label: 'Свои', tone: 'accent', icon: '◐' },
    BUSY: { label: 'Занят', tone: 'amber', icon: '◌' },
    READ: { label: 'Чтение', tone: 'muted', icon: '○' },
  };

export function PresetBadge({ preset }: { preset: Preset }) {
  const { label, tone, icon } = PRESET_BADGE[preset];
  return (
    <Badge tone={tone} icon={icon}>
      {label}
    </Badge>
  );
}
