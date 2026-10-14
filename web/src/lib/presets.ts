import type { Preset } from '@/lib/types';

export const PRESETS: Preset[] = ['FULL', 'OWN', 'BUSY', 'READ'];

export const PRESET_LABELS: Record<Preset, string> = {
  FULL: 'Полный',
  OWN: 'Свои события',
  BUSY: 'Только занятость',
  READ: 'Чтение',
};

export const PRESET_HINTS: Record<Preset, string> = {
  FULL: 'Управление источниками, участниками и токенами; все события.',
  OWN: 'Создание своих событий; чужие видны как «Занято».',
  BUSY: 'Видны только интервалы занятости без деталей.',
  READ: 'Просмотр всех событий без возможности изменений.',
};
