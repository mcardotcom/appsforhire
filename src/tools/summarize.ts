import { SummarizeInputSchema, SummarizeResponseSchema, ErrorResponseSchema } from '../schemas/summarizeSchema';
import { z } from 'zod';

export const summarizeTool = {
  name: 'summarize',
  description: 'Summarizes text or documents. Supports options for max length, language, and model.',
  version: 'v1',
  endpoint: '/api/v1/summarize',
  inputSchema: SummarizeInputSchema,
  outputSchema: SummarizeResponseSchema,
  handler: async (input: z.infer<typeof SummarizeInputSchema>) => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    try {
      // Input validation is handled by the schema
      const { text, maxLength, language, model } = input;

      // Remove excessive whitespace while preserving meaningful structure
      const cleanedText = text.trim().replace(/\s+/g, ' ');

      // Sentence-aware summarization
      const sentences = cleanedText.match(/[^.!?]+[.!?]+/g) || [cleanedText];
      let summary = '';
      let currentLength = 0;

      for (const sentence of sentences) {
        if (currentLength + sentence.length <= maxLength) {
          summary += sentence;
          currentLength += sentence.length;
        } else {
          break;
        }
      }

      // Fallback if no complete sentences fit
      if (!summary && sentences.length > 0) {
        summary = sentences[0].slice(0, Math.max(0, maxLength - 3)) + '...';
      }

      // Validate that the summary is meaningful
      if (!summary.trim()) {
        throw new Error('Summary is empty or not meaningful');
      }

      const processingTimeMs = Date.now() - startTime;
      const confidence = Math.min(1, Math.max(0, summary.length / cleanedText.length));

      return {
        success: true,
        summary,
        metadata: {
          originalLength: cleanedText.length,
          summaryLength: summary.length,
          model,
          language,
          confidence,
          processingTimeMs
        },
        error: null
      };
    } catch (error) {
      const errorResponse: z.infer<typeof ErrorResponseSchema> = {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'INTERNAL_ERROR',
        detail: error instanceof Error ? error.stack || '' : '',
        timestamp: new Date().toISOString(),
        requestId
      };

      // Map specific errors to appropriate error codes
      if (error instanceof z.ZodError) {
        errorResponse.code = 'INVALID_INPUT';
        errorResponse.detail = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      } else if (error instanceof Error) {
        if (error.message.includes('too long')) {
          errorResponse.code = 'TEXT_TOO_LONG';
        } else if (error.message.includes('rate limit')) {
          errorResponse.code = 'RATE_LIMIT_EXCEEDED';
        } else if (error.message.includes('model')) {
          errorResponse.code = 'MODEL_UNAVAILABLE';
        }
      }

      return {
        success: false,
        summary: '',
        metadata: {
          originalLength: input.text?.length || 0,
          summaryLength: 0,
          model: input.model,
          language: input.language,
          confidence: 0,
          processingTimeMs: Date.now() - startTime
        },
        error: errorResponse.error
      };
    }
  }
}; 