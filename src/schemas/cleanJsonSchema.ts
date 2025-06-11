import { z } from 'zod';

export const CleanJsonInputSchema = z.object({
  json: z.string().min(1, 'JSON string is required'),
  options: z.object({
    removeNulls: z.boolean().optional().default(true),
    removeEmptyArrays: z.boolean().optional().default(true),
    removeEmptyObjects: z.boolean().optional().default(true),
    removeEmptyStrings: z.boolean().optional().default(true),
    normalizeTypes: z.boolean().optional().default(true),
    includeOriginal: z.boolean().optional().default(false),
  }).optional().default({})
}); 