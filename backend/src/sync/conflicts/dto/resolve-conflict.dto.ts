import { z } from 'zod';

/**
 * Частичное объединение: незаданные поля берутся из локальной версии.
 * `null` допустим для `description`/`location` (явная очистка).
 */
const mergedDataSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).nullable().optional(),
    start_at: z.coerce.date().optional(),
    end_at: z.coerce.date().optional(),
    all_day: z.boolean().optional(),
    timezone: z.string().min(1).max(64).optional(),
    location: z.string().max(300).nullable().optional(),
  })
  .refine((data) => !data.start_at || !data.end_at || data.end_at >= data.start_at, {
    message: 'Дата окончания раньше даты начала',
    path: ['end_at'],
  });

export const resolveConflictSchema = z.discriminatedUnion('resolution', [
  z.object({ resolution: z.literal('local') }),
  z.object({ resolution: z.literal('external') }),
  z.object({ resolution: z.literal('merged'), merged_data: mergedDataSchema }),
]);

export type ResolveConflictDto = z.infer<typeof resolveConflictSchema>;
export type MergedDataDto = z.infer<typeof mergedDataSchema>;
