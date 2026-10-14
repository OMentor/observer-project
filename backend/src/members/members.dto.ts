import { z } from 'zod';
import { presetSchema } from '../tokens/tokens.dto';

export const updateMemberSchema = z.object({
  preset: presetSchema,
});

export type UpdateMemberDto = z.infer<typeof updateMemberSchema>;
