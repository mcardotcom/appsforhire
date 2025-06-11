import { CleanJsonInputSchema } from '../schemas/cleanJsonSchema';
import { z } from 'zod';

function cleanValue(
  value: any,
  options: {
    removeNulls?: boolean;
    removeEmptyArrays?: boolean;
    removeEmptyObjects?: boolean;
    removeEmptyStrings?: boolean;
    normalizeTypes?: boolean;
  },
  context: {
    fieldsProcessed: number;
    fieldsRemoved: number;
    fieldsNormalized: number;
    warnings: string[];
  },
  path: string = ''
): any {
  context.fieldsProcessed++;
  if (value === null || value === undefined) {
    if (options.removeNulls) {
      context.fieldsRemoved++;
      return undefined;
    }
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '' && options.removeEmptyStrings) {
      context.fieldsRemoved++;
      return undefined;
    }
    return trimmed;
  }
  if (Array.isArray(value)) {
    const cleaned = value
      .map((v, i) => cleanValue(v, options, context, `${path}[${i}]`))
      .filter((v) => v !== undefined);
    if (cleaned.length === 0 && options.removeEmptyArrays) {
      context.fieldsRemoved++;
      return undefined;
    }
    return cleaned;
  }
  if (typeof value === 'object') {
    const cleaned: Record<string, any> = {};
    let hasValid = false;
    for (const [k, v] of Object.entries(value)) {
      const cleanedV = cleanValue(v, options, context, path ? `${path}.${k}` : k);
      if (cleanedV !== undefined) {
        cleaned[k] = cleanedV;
        hasValid = true;
      }
    }
    if (!hasValid && options.removeEmptyObjects) {
      context.fieldsRemoved++;
      return undefined;
    }
    return cleaned;
  }
  return value;
}

export const cleanJsonTool = {
  name: 'clean-json',
  description: 'Fixes broken or malformed JSON strings.',
  version: 'v2',
  endpoint: '/api/v1/clean-json',
  inputSchema: CleanJsonInputSchema,
  outputSchema: z.object({
    success: z.boolean(),
    data: z.any().nullable(),
    metadata: z.object({}),
    error: z.any().nullable(),
    original: z.union([z.object({}), z.string(), z.null()])
  }),
  handler: async (input: z.infer<typeof CleanJsonInputSchema>) => {
    const { json, options } = input;
    const opts = { ...options };
    const context = {
      fieldsProcessed: 0,
      fieldsRemoved: 0,
      fieldsNormalized: 0,
      warnings: [] as string[],
    };
    let parsed: any;
    let error: any = null;
    let cleaned: any = null;
    let success = true;
    try {
      parsed = JSON.parse(json);
    } catch (e) {
      error = { message: 'Invalid JSON', detail: e instanceof Error ? e.message : String(e) };
      success = false;
    }
    if (success) {
      try {
        cleaned = cleanValue(parsed, opts, context);
      } catch (e) {
        error = { message: 'Error cleaning JSON', detail: e instanceof Error ? e.message : String(e) };
        success = false;
      }
    }
    return {
      success,
      data: success ? cleaned : null,
      metadata: {
        fieldsProcessed: context.fieldsProcessed,
        fieldsRemoved: context.fieldsRemoved,
        fieldsNormalized: context.fieldsNormalized,
        warnings: context.warnings,
      },
      original: opts.includeOriginal ? parsed ?? json : undefined,
      error,
    };
  }
}; 