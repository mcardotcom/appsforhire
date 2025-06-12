import { z } from 'zod';
import { get, set } from 'lodash';

// --- 1. Zod Schemas for API Contract ---

const FieldRuleSchema = z.object({
    path: z.string().describe("Dot-notation path to the field (e.g., 'user.address.zip'). Supports a trailing '*' wildcard."),
    type: z.enum(['string', 'number', 'boolean', 'date', 'array', 'object']).optional().describe("Enforce a specific data type."),
    required: z.boolean().optional().describe("If true, the field must exist and not be null after cleaning."),
    defaultValue: z.any().optional().describe("Provides a value if the field is missing, null, or fails validation."),
    transform: z.string().optional().describe("A predefined transformation to apply (e.g., 'toUpperCase', 'toE164')."),
    validate: z.string().optional().describe("A predefined validation rule to apply (e.g., 'isEmail', 'isLength:5')."),
    arrayOptions: z.object({
        delimiter: z.string().optional().describe("Delimiter for string-to-array conversion."),
        removeDuplicates: z.boolean().optional().describe("Remove duplicate primitive values from the array."),
        sort: z.enum(['asc', 'desc']).optional().describe("Sort the array elements."),
    }).optional(),
    dateOptions: z.object({
        outputFormat: z.enum(['iso', 'timestamp']).default('iso').describe("The output format for dates."),
    }).optional(),
}).describe("A rule to apply to a specific field during cleaning.");

export const CleanJsonInputSchema = z.object({
    json: z.string().describe("The raw, potentially malformed JSON string to be cleaned."),
    options: z.object({
        // General Cleaning
        removeNulls: z.boolean().default(true),
        removeEmptyStrings: z.boolean().default(true),
        removeEmptyObjects: z.boolean().default(true),
        removeEmptyArrays: z.boolean().default(true),
        trimStrings: z.boolean().default(true),
        keyCase: z.enum(['camel', 'snake', 'pascal', 'kebab']).optional(),
        // Advanced Type Conversion
        convertStringNumbers: z.boolean().default(true),
        stripCurrency: z.boolean().default(true),
        normalizeBooleans: z.boolean().default(true),
        convertStringArrays: z.boolean().default(false),
        
        // AI Agent Features
        dryRun: z.boolean().default(false),
        agentContext: z.string().optional(),

        // Output & Metadata Control
        outputFields: z.array(z.string()).optional(),
        metadataLevel: z.enum(['summary', 'detailed', 'none']).default('summary'),
    }).optional(),
    fieldRules: z.array(FieldRuleSchema).optional(),
});

export const CleanJsonOutputSchema = z.object({
    success: z.boolean(),
    data: z.any().nullable(),
    error: z.object({
        code: z.string(),
        message: z.string(),
        details: z.any().optional(),
    }).optional(),
    metadata: z.object({
        fieldsProcessed: z.number(),
        fieldsRemoved: z.number(),
        fieldsNormalized: z.number(),
        fieldsValidated: z.number(),
        warnings: z.array(z.object({
            path: z.string(),
            message: z.string(),
            value: z.any(),
        })),
        changes: z.array(z.object({
            path: z.string(),
            oldValue: z.any(),
            newValue: z.any(),
            ruleApplied: z.string(),
        })),
    }).optional(),
    original: z.any().nullable(),
});

// --- 2. Type Definitions ---

type CleaningOptions = z.infer<typeof CleanJsonInputSchema>['options'];
type FieldRule = z.infer<typeof FieldRuleSchema>;

interface CleaningContext {
    fieldsProcessed: number;
    fieldsRemoved: number;
    fieldsNormalized: number;
    fieldsValidated: number;
    warnings: { path: string; message: string; value: any }[];
    errors: { path: string; message: string; value: any }[];
    changes: { path: string; oldValue: any; newValue: any; ruleApplied: string }[];
    path: string[];
}

// --- 3. Safe, Predefined Transformations & Validations ---

const safeTransforms: Record<string, (value: any) => any> = {
    toUpperCase: (v) => typeof v === 'string' ? v.toUpperCase() : v,
    toLowerCase: (v) => typeof v === 'string' ? v.toLowerCase() : v,
    toE164: (v) => {
        if (typeof v !== 'string') return v;
        const digits = v.replace(/\D/g, '');
        return `+${digits.startsWith('1') ? digits : '1' + digits}`;
    },
};

const safeValidations: Record<string, (value: any, arg?: string) => boolean> = {
    isEmail: (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    isLength: (v, arg) => typeof v === 'string' && arg ? v.length === parseInt(arg, 10) : false,
};

// --- 4. Core Cleaning Logic ---

function cleanNode(value: any, options: CleaningOptions, fieldRules: FieldRule[], context: CleaningContext): any {
    context.fieldsProcessed++;
    const currentPath = context.path.join('.');

    // --- Null & Undefined Handling ---
    if (value === null) {
        if (options?.removeNulls ?? true) {
            context.fieldsRemoved++;
            context.changes.push({ path: currentPath, oldValue: null, newValue: undefined, ruleApplied: 'removeNulls' });
            return undefined;
        }
        return null;
    }
    if (value === undefined) return undefined;

    // --- String Cleaning ---
    if (typeof value === 'string') {
        let result = value;
        if (options?.trimStrings ?? true) result = result.trim();
        if ((options?.removeEmptyStrings ?? true) && result === '') {
            context.fieldsRemoved++;
            return undefined;
        }
        // Attempt boolean and number conversion based on options
        if (options?.normalizeBooleans ?? true) {
            const boolVal = z.enum(['true', 'false', '1', '0', 'yes', 'no']).safeParse(result.toLowerCase());
            if(boolVal.success) return ['true', '1', 'yes'].includes(boolVal.data);
        }
        if (options?.convertStringNumbers ?? true) {
             const numStr = (options?.stripCurrency ?? true) ? result.replace(/[\$,€£,]/g, '') : result;
             if (!isNaN(parseFloat(numStr)) && isFinite(Number(numStr))) return parseFloat(numStr);
        }
        return result;
    }

    // --- Array Cleaning ---
    if (Array.isArray(value)) {
        let cleanedArray = value
            .map((item, index) => {
                context.path.push(`[${index}]`);
                const cleanedItem = cleanNode(item, options, fieldRules, context);
                context.path.pop();
                return cleanedItem;
            })
            .filter(item => item !== undefined);

        if (options?.removeEmptyArrays && cleanedArray.length === 0) return undefined;
        return cleanedArray;
    }

    // --- Object Cleaning ---
    if (typeof value === 'object' && value !== null) {
        const cleanedObject: Record<string, any> = {};
        for (const [key, val] of Object.entries(value)) {
            const newKey = options?.keyCase ? z.enum(['camel', 'snake', 'pascal', 'kebab']).parse(options.keyCase) : key;
            context.path.push(newKey);
            const cleanedVal = cleanNode(val, options, fieldRules, context);
            context.path.pop();

            if (cleanedVal !== undefined) cleanedObject[newKey] = cleanedVal;
        }

        if ((options?.removeEmptyObjects ?? true) && Object.keys(cleanedObject).length === 0) return undefined;
        return cleanedObject;
    }

    return value;
}

// --- 5. Main Tool Handler ---

export const cleanJsonTool = {
    name: 'ai-agent-json-cleaner',
    description: 'Cleans, normalizes, and validates JSON data with agent-first features.',
    version: 'v2.0.0',
    inputSchema: CleanJsonInputSchema,
    outputSchema: CleanJsonOutputSchema,
    handler: async (input: z.infer<typeof CleanJsonInputSchema>) => {
        const { json, options = {}, fieldRules = [] } = input;
        const auditId = crypto.randomUUID();

        type MetadataLevel = 'summary' | 'detailed' | 'none';

        const defaultOptions = {
            removeNulls: true,
            removeEmptyStrings: true,
            removeEmptyObjects: true,
            removeEmptyArrays: true,
            trimStrings: true,
            convertStringNumbers: true,
            stripCurrency: true,
            normalizeBooleans: true,
            convertStringArrays: false,
            dryRun: false,
            metadataLevel: 'summary' as MetadataLevel,
            outputFields: undefined as string[] | undefined,
            // Optional properties are not included in defaults
        };

        const mergedOptions = { ...defaultOptions, ...options };

        const context: CleaningContext = {
            fieldsProcessed: 0, fieldsRemoved: 0, fieldsNormalized: 0, fieldsValidated: 0,
            warnings: [], errors: [], changes: [], path: [],
        };

        // Parse Input JSON
        let parsedJson: any;
        try {
            parsedJson = JSON.parse(json);
        } catch (e) {
            return {
                success: false,
                data: null,
                error: {
                    code: 'INVALID_JSON_INPUT',
                    message: e instanceof Error ? e.message : 'The provided string could not be parsed as JSON.',
                    suggestedAction: 'Check the input JSON for syntax errors.',
                },
                auditId,
            };
        }
        
        // Perform Cleaning (or Dry Run)
        const cleanedData = cleanNode(parsedJson, mergedOptions, fieldRules, context);
        
        if (mergedOptions.dryRun) {
            return {
                success: true,
                data: null,
                metadata: {
                    summary: `Dry run: Would process ${context.fieldsProcessed} fields, remove ${context.fieldsRemoved}, and normalize ${context.fieldsNormalized}.`,
                    ...(mergedOptions.metadataLevel === 'detailed' && { changes: context.changes }),
                },
                error: null,
                auditId,
            };
        }

        // Filter Output Fields for token efficiency
        let finalData = cleanedData;
        if (mergedOptions.outputFields?.length) {
            const filteredData: Record<string, any> = {};
            mergedOptions.outputFields.forEach((path: string) => {
                const value = get(cleanedData, path);
                if (value !== undefined) {
                    set(filteredData, path, value);
                }
            });
            finalData = filteredData;
        }

        // Construct Final Response
        const result: any = {
            success: true,
            data: finalData,
            error: null,
            auditId,
        };

        if (mergedOptions.metadataLevel !== 'none') {
            result.metadata = {
                summary: {
                    fieldsProcessed: context.fieldsProcessed,
                    fieldsRemoved: context.fieldsRemoved,
                    fieldsNormalized: context.fieldsNormalized,
                    warnings: context.warnings.length,
                    errors: context.errors.length,
                },
                ...(mergedOptions.metadataLevel === 'detailed' && {
                    warnings: context.warnings,
                    errors: context.errors,
                    changes: context.changes,
                }),
            };
        }

        return result;
    },
}; 