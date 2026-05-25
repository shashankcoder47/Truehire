import { z } from 'zod';

export const fileIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
