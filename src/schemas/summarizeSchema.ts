import { z } from 'zod';

export const SummarizeInputSchema = z.object({
  text: z.string(),
  maxLength: z.number().int().min(10).max(1000).optional().describe('Maximum length of the summary'),
  language: z.string().optional().describe('Language for the summary'),
  model: z.string().optional().describe('Summarization model to use')
}); 