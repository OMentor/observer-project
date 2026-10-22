import { z } from 'zod';

export const linkSourceSchema = z.object({
  connectionId: z.uuid('Некорректный идентификатор подключения'),
  externalCalendarId: z.string().min(1).max(1000),
  externalCalendarName: z.string().max(300).optional(),
  syncDirection: z.enum(['both', 'in', 'out']).optional(),
});

export type LinkSourceDto = z.infer<typeof linkSourceSchema>;
