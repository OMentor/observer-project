import { z } from 'zod';

export const listConflictsQuerySchema = z.object({
  space_id: z.string().uuid().optional(),
  event_id: z.string().uuid().optional(),
  connection_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListConflictsDto = z.infer<typeof listConflictsQuerySchema>;
