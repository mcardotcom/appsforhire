import { z } from 'zod';

// --- 1. Enhanced Interface & Type Definitions ---

// More expressive options for agent control
interface SummarizationOptions {
  summaryLength?: 'short' | 'medium' | 'long'; // Abstract length instead of concrete characters
  format?: 'paragraph' | 'bullet_points' | 'one_sentence'; // Desired output format
  model?: 'fast_extractive' | 'quality_abstractive'; // Model selection based on trade-offs
  language?: string; // ISO 639-1 code
  stripHtml?: boolean; // Option to clean input text
  
  // AI Agent Features
  idempotencyKey?: string;
  agentContext?: string; // e.g., "Summarize for a technical audience"
}

// More detailed metadata for agent reasoning
interface SummaryMetadata {
  originalLengthChars: number;
  summaryLengthChars: number;
  compressionRatio: number;
  modelUsed: string;
  language: string;
  keywords: string[];
  tokenUsage?: {
      inputTokens: number;
      outputTokens: number;
  };
  processingTimeMs: number;
}

// Error codes for better error handling
enum ErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  MODEL_UNAVAILABLE = 'MODEL_UNAVAILABLE',
  TEXT_TOO_SHORT = 'TEXT_TOO_SHORT',
  SUMMARY_GENERATION_FAILED = 'SUMMARY_GENERATION_FAILED'
}

// Standardized, agent-friendly result structure
interface SummarizationResult {
  success: boolean;
  summary: string | null;
  metadata: SummaryMetadata | null;
  error: {
    code: ErrorCode;
    message: string;
    suggestedAction: string;
  } | null;
  auditId: string;
}

// --- 2. Zod Schemas for a Strong API Contract ---

const SummarizeInputSchema = z.object({
  text: z.string().min(100, "Input text must be at least 100 characters for a meaningful summary."),
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

const SummaryMetadataSchema = z.object({
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

const SummarizationResultSchema = z.object({
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

// --- 3. Core Logic & Helpers ---

/**
 * A more robust sentence splitter that handles common abbreviations.
 */
function splitIntoSentences(text: string): string[] {
    const sentences = text.match(/[^.!?\s][^.!?]*(?:[.!?](?!['"]?\s|$)[^.!?]*)*[.!?]?['"]?(?=\s|$)/g);
    return sentences || [text];
}

/**
 * Simple keyword extraction based on word frequency (removes common stop words).
 */
function extractKeywords(text: string): string[] {
    const stopWords = new Set(['i','me','my','myself','we','our','ours','ourselves','you','your','yours','yourself','yourselves','he','him','his','himself','she','her','hers','herself','it','its','itself','they','them','their','theirs','themselves','what','which','who','whom','this','that','these','those','am','is','are','was','were','be','been','being','have','has','had','having','do','does','did','doing','a','an','the','and','but','if','or','because','as','until','while','of','at','by','for','with','about','against','between','into','through','during','before','after','above','below','to','from','up','down','in','out','on','off','over','under','again','further','then','once','here','there','when','where','why','how','all','any','both','each','few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very','s','t','can','will','just','don','should','now']);
    const wordCounts: Record<string, number> = {};
    const words = text.toLowerCase().match(/\b(\w+)\b/g) || [];

    for (const word of words) {
        if (!stopWords.has(word) && word.length > 2) {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
    }
    return Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(entry => entry[0]);
}

/**
 * The 'fast_extractive' summarization logic.
 */
function extractiveSummary(text: string, options: z.infer<typeof SummarizeInputSchema>['options']): string {
    const sentences = splitIntoSentences(text);
    const lengthMap = { short: 0.2, medium: 0.4, long: 0.7 };
    const summaryLength = options.summaryLength || 'medium';
    const maxLength = text.length * lengthMap[summaryLength];
    
    if (options.format === 'one_sentence') {
        return sentences[0] || '';
    }
    
    let summary = '';
    for (const sentence of sentences) {
        if ((summary.length + sentence.length) <= maxLength) {
            summary += sentence + ' ';
        } else {
            break;
        }
    }
    
    if (options.format === 'bullet_points') {
        return splitIntoSentences(summary.trim()).map(s => `- ${s}`).join('\n');
    }

    return summary.trim();
}

/**
 * A mock for the 'quality_abstractive' summarization logic.
 * In a real application, this would call an external LLM API.
 */
async function abstractiveSummary(text: string, options: z.infer<typeof SummarizeInputSchema>['options']): Promise<{summary: string, tokenUsage: {inputTokens: number, outputTokens: number}}> {
    const prompt = `
        Summarize the following text for the purpose of: "${options.agentContext || 'general understanding'}".
        The desired language is ${options.language || 'en'}.
        The desired length is "${options.summaryLength || 'medium'}".
        The output format should be: "${options.format || 'paragraph'}".

        Text to summarize:
        ---
        ${text}
        ---
        Summary:
    `;
    
    // --- MOCK API CALL ---
    console.log("Making mock API call to an LLM with the following prompt:", prompt);
    const mockSummary = `This is a high-quality, abstractive summary generated for the purpose of "${options.agentContext || 'general understanding'}", as requested. It is formatted as a ${options.format || 'paragraph'}.`;
    // --- END MOCK API CALL ---

    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = Math.ceil(mockSummary.length / 4);
    
    return Promise.resolve({ summary: mockSummary, tokenUsage: { inputTokens, outputTokens }});
}

// --- 4. Main Tool Handler ---

export const summarizeTool = {
  name: 'summarize-pro',
  description: 'Summarizes text using either fast extractive or high-quality abstractive models, with multiple format options.',
  version: 'v2.0.0', // Version bump for new features
  inputSchema: SummarizeInputSchema,
  outputSchema: SummarizationResultSchema,
  
  handler: async (input: z.infer<typeof SummarizeInputSchema>): Promise<SummarizationResult> => {
    const startTime = Date.now();
    const auditId = crypto.randomUUID();

    try {
      let textToSummarize = input.text;
      if (input.options.stripHtml) {
        textToSummarize = textToSummarize.replace(/<[^>]*>?/gm, '');
      }
      textToSummarize = textToSummarize.trim().replace(/\s+/g, ' ');

      if (textToSummarize.length < 100) {
        throw new Error("Cleaned text is too short for a meaningful summary.");
      }
      
      let summary: string;
      let tokenUsage: { inputTokens: number; outputTokens: number; } | undefined;

      // 2. Branch logic based on selected model
      if (input.options.model === 'quality_abstractive') {
          const result = await abstractiveSummary(textToSummarize, input.options);
          summary = result.summary;
          tokenUsage = result.tokenUsage;
      } else {
          summary = extractiveSummary(textToSummarize, input.options);
      }
      
      if (!summary) {
          throw new Error("Failed to generate a summary.");
      }

      // 3. Generate rich metadata
      const processingTimeMs = Date.now() - startTime;
      const metadata: SummaryMetadata = {
        originalLengthChars: textToSummarize.length,
        summaryLengthChars: summary.length,
        compressionRatio: parseFloat((summary.length / textToSummarize.length).toFixed(2)),
        modelUsed: input.options.model || 'fast_extractive',
        language: input.options.language || 'en',
        keywords: extractKeywords(textToSummarize),
        tokenUsage,
        processingTimeMs,
      };

      const result: SummarizationResult = {
        success: true,
        summary,
        metadata,
        error: null,
        auditId,
      };

      return result;

    } catch (error) {
        const result: SummarizationResult = {
            success: false,
            summary: null,
            metadata: null,
            error: {
                code: error instanceof z.ZodError ? ErrorCode.INVALID_INPUT : ErrorCode.PROCESSING_ERROR,
                message: error instanceof Error ? error.message : 'An unknown error occurred.',
                suggestedAction: 'Please check your input and options. If using the abstractive model, the service may be temporarily unavailable.'
            },
            auditId,
        };
        return result;
    }
  }
};
