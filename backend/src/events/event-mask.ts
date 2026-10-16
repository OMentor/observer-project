import { Preset } from '@prisma/client';

export interface HasCreator {
  creator_id: string;
}

export interface MaskableEvent extends HasCreator {
  title: string;
  description: string | null;
  location: string | null;
}

export function isEventMasked(
  event: HasCreator,
  preset: Preset,
  userId: string,
): boolean {
  return preset === 'BUSY' || (preset === 'OWN' && event.creator_id !== userId);
}

export function maskEvent<T extends MaskableEvent>(
  event: T,
  preset: Preset,
  userId: string,
): T & { busy: boolean } {
  if (!isEventMasked(event, preset, userId)) {
    return { ...event, busy: false };
  }
  return {
    ...event,
    title: 'Занято',
    description: null,
    location: null,
    busy: true,
  };
}
