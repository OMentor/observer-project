import { z } from 'zod';

/**
 * Канонический снимок полей события, хранимый в `SyncConflict.local_data`
 * и `external_data`. Даты — ISO-строки (JSON), чтобы структура была
 * одинаковой для локальной и внешней версии.
 */
export interface ConflictFields {
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  timezone: string;
  location: string | null;
  rrule: string | null;
}

/** Валидация сохранённого снимка (защита от несовместимой структуры). */
export const conflictSnapshotSchema = z.object({
  title: z.string(),
  description: z.string().nullable(),
  start_at: z.string(),
  end_at: z.string(),
  all_day: z.boolean(),
  timezone: z.string().nullable().optional(),
  location: z.string().nullable(),
  rrule: z.string().nullable().optional(),
});

/** Поля события Prisma, применяемые из снимка (даты — инстанты). */
export interface EventDataInput {
  title: string;
  description: string | null;
  start_at: Date;
  end_at: Date;
  all_day: boolean;
  timezone: string;
  location: string | null;
  rrule: string | null;
}

/** Приводит снимок к полям события Prisma. */
export function toEventData(fields: ConflictFields): EventDataInput {
  return {
    title: fields.title,
    description: fields.description,
    start_at: new Date(fields.start_at),
    end_at: new Date(fields.end_at),
    all_day: fields.all_day,
    timezone: fields.timezone ?? 'UTC',
    location: fields.location,
    rrule: fields.rrule ?? null,
  };
}
