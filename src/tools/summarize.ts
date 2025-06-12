import { SummarizeInputSchema } from '../schemas/summarizeSchema';
import { z } from 'zod';

export const summarizeTool = {
  name: 'summarize',
  description: 'Summarizes text or documents. Supports options for max length, language, and model.',
  version: 'v1',
  endpoint: '/api/v1/summarize',
  inputSchema: SummarizeInputSchema,
  outputSchema: z.object({
    success: z.boolean(),
    summary: z.string(),
    metadata: z.object({
      originalLength: z.number(),
      summaryLength: z.number(),
      model: z.string().optional(),
      language: z.string().optional()
    }),
    error: z.any().nullable()
  }),
  handler: async (input: z.infer<typeof SummarizeInputSchema>) => {
    try {
      // Basic summarization: return the first N sentences or maxLength characters
      const { text, maxLength = 200, language, model } = input;
      let summary = text;
      if (text.length > maxLength) {
        // Naive: cut at maxLength, try to end at a sentence
        const cut = text.slice(0, maxLength);
        const lastPeriod = cut.lastIndexOf('.') + 1;
        summary = lastPeriod > 0 ? cut.slice(0, lastPeriod) : cut;
      }
      // TODO: Plug in advanced summarization model here if available
      return {
        success: true,
        summary,
        metadata: {
          originalLength: text.length,
          summaryLength: summary.length,
          model,
          language
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        summary: '',
        metadata: {},
        error: error instanceof Error ? error.message : error
      };
    }
  }
}; 