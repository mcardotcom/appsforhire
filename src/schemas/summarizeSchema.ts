import { z } from 'zod';

export const SummarizeInputSchema = z.object({
  text: z.string()
}); 