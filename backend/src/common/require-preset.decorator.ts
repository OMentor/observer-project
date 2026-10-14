import { SetMetadata } from '@nestjs/common';
import { Preset } from '@prisma/client';

export type PresetResource =
  | 'space'
  | 'space-body'
  | 'source'
  | 'event'
  | 'member'
  | 'token';

export interface PresetRequirement {
  presets: Preset[];
  resource: PresetResource;
}

export const PRESET_KEY = 'require_preset';

export const RequirePreset = (
  presets: Preset[],
  resource: PresetResource = 'space',
) => SetMetadata(PRESET_KEY, { presets, resource } satisfies PresetRequirement);
