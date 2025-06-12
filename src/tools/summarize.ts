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
        // For one sentence, try to find the most informative sentence
        const firstSentence = sentences[0];
        const lastSentence = sentences[sentences.length - 1];
        const middleSentence = sentences[Math.floor(sentences.length / 2)];
        
        // Prefer the first sentence if it's not too long
        if (firstSentence.length <= 200) {
            return firstSentence;
        }
        // Otherwise, combine key information from first and last
        return `${firstSentence.split('.')[0]}. ${lastSentence}`;
    }
    
    // Score sentences based on position, content, and importance
    const scoredSentences = sentences.map((sentence, index) => {
        // Position score: First and last sentences are often important
        const positionScore = index === 0 ? 2 : index === sentences.length - 1 ? 1.5 : 1;
        
        // Length score: Prefer sentences that are neither too short nor too long
        const lengthScore = sentence.length > 50 && sentence.length < 200 ? 1.5 : 1;
        
        // Keyword score: Sentences with more keywords are likely more important
        const keywordScore = extractKeywords(sentence).length * 0.5;
        
        // Content score: Boost sentences that appear to be section headers, list items, or contain important markers
        const isMainHeader = sentence.match(/^[A-Z][^.!?]*:$/) || 
                           sentence.match(/^[A-Z][^.!?]*\s*\([^)]+\):$/) ||
                           sentence.match(/^[A-Z][^.!?]*\s*:$/) ||
                           sentence.match(/^[^.!?]*:$/);  // Any line ending with colon
        const isSubHeader = sentence.match(/^[A-Z][^.!?]*\s*\([^)]+\):/) ||
                          sentence.match(/^[A-Z][^.!?]*\s*:/) ||
                          sentence.match(/^[^.!?]*:$/);  // Any line ending with colon
        const isListItem = sentence.match(/^[•\-\*]\s|^\d+\.\s/);
        const hasImportantMarkers = sentence.match(/\b(important|key|critical|significant|primary|major)\b/i);
        
        // Check for author and metadata information
        const isAuthorInfo = sentence.match(/\b(by|author|written by|prepared by|created by)\b/i) ||
                           sentence.match(/^[A-Z][a-z]+ [A-Z][a-z]+$/);  // Simple name pattern
        const isMetadata = sentence.match(/\b(version|date|created|updated|revised|draft|final)\b/i) ||
                          sentence.match(/\d{4}-\d{2}-\d{2}/) ||  // Date pattern
                          sentence.match(/\bv\d+\.\d+\b/);  // Version pattern
        
        let contentScore = 1;
        if (isMainHeader) contentScore = 1.5;
        else if (isSubHeader) contentScore = 1.4;
        else if (isListItem) contentScore = 1.3;
        else if (hasImportantMarkers) contentScore = 1.2;
        else if (isAuthorInfo) contentScore = 1.1;  // Slightly boost author info
        else if (isMetadata) contentScore = 0.8;    // Slightly reduce metadata importance
        
        return {
            sentence,
            score: positionScore * lengthScore * (1 + keywordScore) * contentScore,
            isMainHeader,
            isSubHeader,
            isListItem,
            isAuthorInfo,
            isMetadata
        };
    });
    
    // Sort by score and take top sentences until we reach maxLength
    let summary = '';
    let currentSection = '';
    let inList = false;
    let indentLevel = 0;
    let lastWasHeader = false;
    let authorInfo = '';
    let metadata = '';
    
    // First, collect author and metadata information
    for (const { sentence, isAuthorInfo, isMetadata } of scoredSentences) {
        if (isAuthorInfo) {
            authorInfo = sentence;
        } else if (isMetadata) {
            metadata = sentence;
        }
    }
    
    // Then build the summary
    for (const { sentence, isMainHeader, isSubHeader, isListItem } of scoredSentences.sort((a, b) => b.score - a.score)) {
        if ((summary.length + sentence.length) <= maxLength) {
            // Handle main section headers
            if (isMainHeader) {
                if (currentSection) {
                    summary += '\n\n';
                }
                currentSection = sentence;
                summary += sentence + '\n';
                inList = false;
                indentLevel = 0;
                lastWasHeader = true;
            }
            // Handle subsection headers
            else if (isSubHeader) {
                if (currentSection) {
                    summary += '\n';
                }
                // If the last line was a header, we're at the same level
                // Otherwise, we're nested one level deeper
                if (!lastWasHeader) {
                    indentLevel++;
                }
                summary += '  '.repeat(indentLevel) + sentence + '\n';
                inList = false;
                lastWasHeader = true;
            }
            // Handle list items
            else if (isListItem) {
                if (!inList && currentSection) {
                    summary += '\n';
                }
                summary += '  '.repeat(indentLevel + 1) + sentence + '\n';
                inList = true;
                lastWasHeader = false;
            }
            // Regular sentence
            else {
                if (inList) {
                    summary += '\n';
                    inList = false;
                }
                if (indentLevel > 0) {
                    summary += '  '.repeat(indentLevel);
                }
                summary += sentence + ' ';
                lastWasHeader = false;
            }
        } else {
            break;
        }
    }
    
    // Add author and metadata information if available
    if (authorInfo || metadata) {
        summary += '\n\n';
        if (authorInfo) {
            summary += `Author: ${authorInfo}\n`;
        }
        if (metadata) {
            summary += `Metadata: ${metadata}\n`;
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

        Guidelines:
        - Maintain key points and main arguments
        - Preserve important details and context
        - Ensure logical flow and coherence
        - Include relevant background information
        - Highlight implications and conclusions
        - Keep a clear and professional tone
        - Structure the summary with clear sections if appropriate
        - Focus on actionable insights and key recommendations

        Text to summarize:
        ---
        ${text}
        ---
        Summary:
    `;
    
    // --- MOCK API CALL ---
    console.log("Making mock API call to an LLM with the following prompt:", prompt);
    
    // For now, use the improved extractive summary as a fallback
    const fallbackSummary = extractiveSummary(text, options);
    const mockSummary = `Based on the provided text, here's a comprehensive summary:\n\n${fallbackSummary}\n\nThis summary captures the key points and recommendations while maintaining the original context and accuracy.`;
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
