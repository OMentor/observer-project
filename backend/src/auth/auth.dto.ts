import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1, 'Имя обязательно').max(120),
  email: z.email('Некорректный email'),
  password: z.string().min(8, 'Минимум 8 символов').max(128),
  timezone: z.string().min(1).max(64).optional(),
});

export const loginSchema = z.object({
  email: z.email('Некорректный email'),
  password: z.string().min(1, 'Пароль обязателен'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken обязателен'),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshDto = z.infer<typeof refreshSchema>;
