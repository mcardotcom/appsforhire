import { CleanJsonInputSchema } from '../schemas/cleanJsonSchema';
import { z } from 'zod';

// --- Enhanced Cleaning Logic ---

interface CleaningOptions {
  removeNulls?: boolean;
  removeEmptyArrays?: boolean;
  removeEmptyObjects?: boolean;
  removeEmptyStrings?: boolean;
  normalizeTypes?: boolean;
  normalizeBooleans?: boolean;
  normalizeNumbers?: boolean;
  normalizeDates?: boolean;
  normalizeArrays?: boolean;
  schema?: z.ZodSchema<any>;
  strictMode?: boolean;
  fieldRules?: Record<string, FieldRule>;
  removeUnknownFields?: boolean;
  convertStringNumbers?: boolean;
  handleDuplicateKeys?: 'keep-first' | 'keep-last' | 'merge';
}

interface FieldRule {
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date';
  required?: boolean;
  transform?: (value: any) => any;
  validate?: (value: any) => boolean;
  defaultValue?: any;
}

interface CleaningContext {
  fieldsProcessed: number;
  fieldsRemoved: number;
  fieldsNormalized: number;
  fieldsValidated: number;
  warnings: string[];
  errors: string[];
  path: string[];
}

function normalizeBoolean(value: any): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    if (['true', 'yes', '1', 'on', 'enabled'].includes(lower)) return true;
    if (['false', 'no', '0', 'off', 'disabled'].includes(lower)) return false;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return undefined;
}

function normalizeNumber(value: any): number | undefined {
  if (typeof value === 'number') return isNaN(value) ? undefined : value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return undefined;
    const writtenNumbers: Record<string, number> = {
      'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'twenty': 20, 'thirty': 30, 'thirty-five': 35, 'forty': 40, 'fifty': 50
    };
    if (writtenNumbers[trimmed.toLowerCase()]) {
      return writtenNumbers[trimmed.toLowerCase()];
    }
    const parsed = parseFloat(trimmed);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function normalizeDate(value: any): string | undefined {
  if (!value) return undefined;
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return undefined;
    return date.toISOString();
  } catch {
    return undefined;
  }
}

function normalizeArray(value: any, delimiter: string = ','): any[] | undefined {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    return value.split(delimiter).map(item => item.trim()).filter(Boolean);
  }
  return undefined;
}

function applyFieldRule(value: any, rule: FieldRule, context: CleaningContext): any {
  let result = value;
  if (rule.transform) {
    try {
      result = rule.transform(result);
    } catch (error) {
      context.warnings.push(`Transform failed at ${context.path.join('.')}: ${error}`);
    }
  }
  if (rule.type) {
    switch (rule.type) {
      case 'boolean':
        result = normalizeBoolean(result);
        break;
      case 'number':
        result = normalizeNumber(result);
        break;
      case 'date':
        result = normalizeDate(result);
        break;
      case 'array':
        result = normalizeArray(result);
        break;
      case 'string':
        result = typeof result === 'string' ? result : String(result);
        break;
    }
  }
  if (rule.validate && !rule.validate(result)) {
    context.warnings.push(`Validation failed at ${context.path.join('.')}`);
    result = rule.defaultValue;
  }
  if (rule.required && (result === undefined || result === null)) {
    if (rule.defaultValue !== undefined) {
      result = rule.defaultValue;
    } else {
      context.errors.push(`Required field missing: ${context.path.join('.')}`);
    }
  }
  return result;
}

function cleanValue(
  value: any,
  options: CleaningOptions,
  context: CleaningContext,
  key?: string
): any {
  context.fieldsProcessed++;
  const currentPath = key ? [...context.path, key] : context.path;
  const pathString = currentPath.join('.');
  const fieldRule = options.fieldRules?.[pathString] || options.fieldRules?.[key || ''];
  if (fieldRule) {
    const oldPath = context.path;
    context.path = currentPath;
    const result = applyFieldRule(value, fieldRule, context);
    context.path = oldPath;
    if (result !== value) context.fieldsNormalized++;
    value = result;
  }
  if (value === null || value === undefined) {
    if (options.removeNulls) {
      context.fieldsRemoved++;
      return undefined;
    }
    return value;
  }
  if (typeof value === 'string') {
    let result = value.trim();
    if (result === '' && options.removeEmptyStrings) {
      context.fieldsRemoved++;
      return undefined;
    }
    if (options.convertStringNumbers && /^\d+(\.\d+)?$/.test(result)) {
      const num = parseFloat(result);
      context.fieldsNormalized++;
      return num;
    }
    return result;
  }
  if (Array.isArray(value)) {
    const oldPath = context.path;
    context.path = currentPath;
    const cleaned = value
      .map((v, i) => cleanValue(v, options, context, `[${i}]`))
      .filter((v) => v !== undefined);
    context.path = oldPath;
    if (cleaned.length === 0 && options.removeEmptyArrays) {
      context.fieldsRemoved++;
      return undefined;
    }
    return cleaned;
  }
  if (typeof value === 'object') {
    const cleaned: Record<string, any> = {};
    let hasValid = false;
    const oldPath = context.path;
    context.path = currentPath;
    for (const [k, v] of Object.entries(value)) {
      const cleanedV = cleanValue(v, options, context, k);
      if (cleanedV !== undefined) {
        cleaned[k] = cleanedV;
        hasValid = true;
      }
    }
    context.path = oldPath;
    if (!hasValid && options.removeEmptyObjects) {
      context.fieldsRemoved++;
      return undefined;
    }
    return cleaned;
  }
  if (typeof value === 'number') {
    if (options.normalizeNumbers) {
      if (Number.isInteger(value) || (value % 1 === 0)) {
        return Math.round(value);
      }
    }
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
    const opts: CleaningOptions = {
      ...options
    };
    const context: CleaningContext = {
      fieldsProcessed: 0,
      fieldsRemoved: 0,
      fieldsNormalized: 0,
      fieldsValidated: 0,
      warnings: [],
      errors: [],
      path: []
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
        if (opts.schema) {
          const result = opts.schema.safeParse(cleaned);
          if (!result.success) {
            if (opts.strictMode) {
              throw new Error(`Schema validation failed: ${result.error.message}`);
            } else {
              context.warnings.push(`Schema validation warnings: ${result.error.message}`);
            }
          } else {
            cleaned = result.data;
            context.fieldsValidated++;
          }
        }
      } catch (e) {
        error = { message: 'Error cleaning JSON', detail: e instanceof Error ? e.message : String(e) };
        success = false;
      }
    }
    return {
      success,
      data: success ? cleaned : null,
      metadata: {
        ...context,
        summary: {
          processed: context.fieldsProcessed,
          removed: context.fieldsRemoved,
          normalized: context.fieldsNormalized,
          validated: context.fieldsValidated,
          hasWarnings: context.warnings.length > 0,
          hasErrors: context.errors.length > 0
        }
      },
      original: (options && (options as any).includeOriginal) ? parsed ?? json : undefined,
      error
    };
  }
}; 