import { z } from 'zod';

export const createSpaceSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(120),
});

export const updateSpaceSchema = z.object({
  name: z.string().min(1).max(120).optional(),
});

export type CreateSpaceDto = z.infer<typeof createSpaceSchema>;
export type UpdateSpaceDto = z.infer<typeof updateSpaceSchema>;
