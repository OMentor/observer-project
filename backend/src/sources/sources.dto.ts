import { z } from 'zod';

export const createSourceSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(120),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Цвет в формате #RRGGBB')
    .optional(),
  visibility: z.enum(['SHARED', 'PRIVATE']).optional(),
});

export const updateSourceSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Цвет в формате #RRGGBB')
    .optional(),
  visibility: z.enum(['SHARED', 'PRIVATE']).optional(),
});

export type CreateSourceDto = z.infer<typeof createSourceSchema>;
export type UpdateSourceDto = z.infer<typeof updateSourceSchema>;
