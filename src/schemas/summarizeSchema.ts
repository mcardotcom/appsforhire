import { z } from 'zod';

// Error codes for better error handling
export enum ErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  MODEL_UNAVAILABLE = 'MODEL_UNAVAILABLE',
  TEXT_TOO_SHORT = 'TEXT_TOO_SHORT',
  SUMMARY_GENERATION_FAILED = 'SUMMARY_GENERATION_FAILED'
}

export const SummarizeInputSchema = z.object({
  text: z.string()
    .min(100, "Input text must be at least 100 characters for a meaningful summary.")
    .max(100000)
    .regex(/^[\s\S]*\S[\s\S]*$/, "Text must contain at least one non-whitespace character")
    .describe("Text to summarize"),
  options: z.object({
    summaryLength: z.enum(['short', 'medium', 'long']).default('medium'),
    format: z.enum(['paragraph', 'bullet_points', 'one_sentence']).default('paragraph'),
    model: z.enum(['fast_extractive', 'quality_abstractive']).default('fast_extractive'),
    language: z.string().default('en'),
    stripHtml: z.boolean().default(true),
    idempotencyKey: z.string().optional(),
    agentContext: z.string().optional(),
  }).optional().default({}),
});

export const SummaryMetadataSchema = z.object({
  originalLengthChars: z.number(),
  summaryLengthChars: z.number(),
  compressionRatio: z.number(),
  modelUsed: z.string(),
  language: z.string(),
  keywords: z.array(z.string()),
  tokenUsage: z.object({
    inputTokens: z.number(),
    outputTokens: z.number()
  }).optional(),
  processingTimeMs: z.number()
});

export const SummarizeResponseSchema = z.object({
  success: z.boolean(),
  summary: z.string().nullable(),
  metadata: SummaryMetadataSchema.nullable(),
  error: z.object({
    code: z.nativeEnum(ErrorCode),
    message: z.string(),
    suggestedAction: z.string()
  }).nullable(),
  auditId: z.string()
});

export const ErrorResponseSchema = z.object({
  error: z.string().describe("Error message"),
  code: z.nativeEnum(ErrorCode).describe("Error code for programmatic handling"),
  detail: z.string().describe("Detailed error information"),
  timestamp: z.string().datetime().describe("When the error occurred"),
  requestId: z.string().describe("Unique request identifier for debugging")
}); 