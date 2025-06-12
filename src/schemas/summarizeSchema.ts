import { z } from 'zod';

export const SummarizeInputSchema = z.object({
  text: z.string()
    .min(1)
    .max(100000)
    .regex(/^[\s\S]*\S[\s\S]*$/, "Text must contain at least one non-whitespace character")
    .describe("Text to summarize"),
  maxLength: z.number()
    .int()
    .min(10)
    .max(1000)
    .default(200)
    .describe("Maximum length of the summary"),
  language: z.enum(["en", "es", "fr", "de", "it", "pt"])
    .default("en")
    .describe("Language for the summary"),
  model: z.enum(["basic", "advanced", "gpt-3.5", "gpt-4"])
    .default("basic")
    .describe("Summarization model to use")
});

export const SummaryMetadataSchema = z.object({
  originalLength: z.number().min(0),
  summaryLength: z.number().min(0),
  model: z.string(),
  language: z.string(),
  confidence: z.number().min(0).max(1).describe("Confidence score (0-1)"),
  processingTimeMs: z.number().min(0).describe("Processing time in milliseconds")
});

export const SummarizeResponseSchema = z.object({
  success: z.boolean(),
  summary: z.string(),
  metadata: SummaryMetadataSchema,
  error: z.string().nullable()
});

export const ErrorResponseSchema = z.object({
  error: z.string().describe("Error message"),
  code: z.enum([
    "INVALID_INPUT",
    "TEXT_TOO_LONG",
    "RATE_LIMIT_EXCEEDED",
    "MODEL_UNAVAILABLE",
    "INTERNAL_ERROR"
  ]).describe("Error code for programmatic handling"),
  detail: z.string().describe("Detailed error information"),
  timestamp: z.string().datetime().describe("When the error occurred"),
  requestId: z.string().describe("Unique request identifier for debugging")
}); 