import { z } from 'zod';
import { RRule } from 'rrule';

function isValidRrule(value: string | null | undefined): boolean {
  if (!value) {
    return true;
  }
  try {
    const parsed = RRule.parseString(value);
    return parsed.freq !== undefined && parsed.freq !== null;
  } catch {
    return false;
  }
}

const rruleField = z.string().max(500).nullable().optional();

function checkRrule(
  data: { rrule?: string | null },
  ctx: z.RefinementCtx,
) {
  if (!isValidRrule(data.rrule)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['rrule'],
      message: 'Некорректное RRULE-правило',
    });
  }
}

export const createEventSchema = z
  .object({
    title: z.string().min(1, 'Заголовок обязателен').max(200),
    description: z.string().max(5000).optional(),
    start_at: z.coerce.date(),
    end_at: z.coerce.date(),
    all_day: z.boolean().optional(),
    timezone: z.string().min(1).max(64).optional(),
    location: z.string().max(300).optional(),
    rrule: rruleField,
  })
  .superRefine(checkRrule)
  .refine((data) => data.end_at >= data.start_at, {
    message: 'Дата окончания раньше даты начала',
    path: ['end_at'],
  });

export const updateEventSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).nullable().optional(),
    start_at: z.coerce.date().optional(),
    end_at: z.coerce.date().optional(),
    all_day: z.boolean().optional(),
    timezone: z.string().min(1).max(64).optional(),
    location: z.string().max(300).nullable().optional(),
    rrule: rruleField,
    scope: z.enum(['single', 'all']).optional(),
    occurrence_at: z.coerce.date().optional(),
  })
  .superRefine(checkRrule)
  .refine(
    (data) =>
      !data.start_at || !data.end_at || data.end_at >= data.start_at,
    { message: 'Дата окончания раньше даты начала', path: ['end_at'] },
  )
  .refine((data) => data.scope !== 'single' || !!data.occurrence_at, {
    message: 'occurrence_at обязателен при scope=single',
    path: ['occurrence_at'],
  });

export const eventScopeSchema = z.object({
  scope: z.enum(['single', 'all']).optional(),
  occurrence_at: z.coerce.date().optional(),
});

export const deleteEventSchema = eventScopeSchema.refine(
  (data) => data.scope !== 'single' || !!data.occurrence_at,
  {
    message: 'occurrence_at обязателен при scope=single',
    path: ['occurrence_at'],
  },
);

export const listEventsSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const listAllEventsSchema = z.object({
  space_id: z.string().uuid().optional(),
  source_id: z.string().uuid().optional(),
  creator_id: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  q: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

export type CreateEventDto = z.infer<typeof createEventSchema>;
export type UpdateEventDto = z.infer<typeof updateEventSchema>;
export type EventScopeDto = z.infer<typeof eventScopeSchema>;
export type DeleteEventDto = z.infer<typeof deleteEventSchema>;
export type ListEventsDto = z.infer<typeof listEventsSchema>;
export type ListAllEventsDto = z.infer<typeof listAllEventsSchema>;
