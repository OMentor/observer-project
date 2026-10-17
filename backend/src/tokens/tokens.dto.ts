import { z } from 'zod';

export const presetSchema = z.enum(['FULL', 'OWN', 'BUSY', 'READ']);

// z.coerce.date() приводит null к new Date(0) (1970-01-01), что делает
// токен сразу истёкшим. Нормализуем null/'' в undefined до приведения типа.
const optionalExpiry = z.preprocess(
  (value) =>
    value === null || value === '' || value === undefined ? undefined : value,
  z.coerce.date().optional(),
);

export const createTokenSchema = z.object({
  preset: presetSchema,
  expires_at: optionalExpiry,
});

export const batchTokenSchema = z.object({
  space_id: z.string().uuid(),
  preset: presetSchema,
  count: z.number().int().min(1).max(100).default(1),
  expires_at: optionalExpiry,
});

export const activateTokenSchema = z.object({
  name: z.string().min(1).max(120).optional(),
});

export type CreateTokenDto = z.infer<typeof createTokenSchema>;
export type BatchTokenDto = z.infer<typeof batchTokenSchema>;
export type ActivateTokenDto = z.infer<typeof activateTokenSchema>;
