import { z } from 'zod';

export const eventFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Введите название'),
    sourceId: z.string().min(1, 'Выберите источник'),
    date: z.string().min(1, 'Укажите дату'),
    startTime: z.string(),
    endTime: z.string(),
    allDay: z.boolean(),
    location: z.string(),
    description: z.string(),
  })
  .superRefine((value, ctx) => {
    if (value.allDay) {
      return;
    }
    const start = new Date(`${value.date}T${value.startTime}`);
    const end = new Date(`${value.date}T${value.endTime}`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: 'custom',
        message: 'Некорректная дата',
        path: ['date'],
      });
      return;
    }
    if (end <= start) {
      ctx.addIssue({
        code: 'custom',
        message: 'Окончание раньше начала',
        path: ['endTime'],
      });
    }
  });

export type EventFormValues = z.infer<typeof eventFormSchema>;
