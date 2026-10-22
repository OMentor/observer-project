import { z } from 'zod';

export const connectionProviderSchema = z.enum(['yandex', 'mailru', 'apple']);

export const createConnectionSchema = z.object({
  provider: connectionProviderSchema,
  url: z.url('Некорректный URL').max(500),
  username: z.string().min(1, 'Логин обязателен').max(200),
  password: z.string().min(1, 'Пароль приложения обязателен').max(500),
});

export type CreateConnectionDto = z.infer<typeof createConnectionSchema>;
