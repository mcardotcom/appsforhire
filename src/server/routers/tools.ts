import { z } from 'zod';
import { router, publicProcedure, apiKeyProcedure } from '../trpc';

// Tool metadata schema
const ToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  version: z.string(),
  endpoint_path: z.string(),
});

// Input schemas for each tool
const CleanJsonInputSchema = z.object({
  json: z.string(),
  options: z.object({
    removeNulls: z.boolean().optional(),
    removeEmptyArrays: z.boolean().optional(),
    removeEmptyObjects: z.boolean().optional(),
  }).optional(),
});

const CheckCsvInputSchema = z.object({
  csv: z.string(),
  options: z.object({
    checkHeaders: z.boolean().optional(),
    validateData: z.boolean().optional(),
  }).optional(),
});

const SummarizeInputSchema = z.object({
  text: z.string(),
  options: z.object({
    maxLength: z.number().optional(),
    format: z.enum(['bullet', 'paragraph']).optional(),
  }).optional(),
});

export const toolsRouter = router({
  // Tool discovery endpoint
  list: publicProcedure.query(async ({ ctx }) => {
    const tools = await ctx.prisma.tool.findMany({
      where: { is_active: true },
    });
    return tools;
  }),

  // Clean JSON endpoint
  cleanJson: apiKeyProcedure
    .input(CleanJsonInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const parsedJson = JSON.parse(input.json);
        let cleaned = typeof parsedJson === 'object' && parsedJson !== null ? { ...parsedJson } : {};

        if (input.options?.removeNulls && typeof cleaned === 'object' && cleaned !== null) {
          cleaned = Object.fromEntries(
            Object.entries(cleaned).filter(([_, v]) => v !== null)
          );
        }

        if (input.options?.removeEmptyArrays && typeof cleaned === 'object' && cleaned !== null) {
          cleaned = Object.fromEntries(
            Object.entries(cleaned).filter(([_, v]) => !Array.isArray(v) || v.length > 0)
          );
        }

        if (input.options?.removeEmptyObjects && typeof cleaned === 'object' && cleaned !== null) {
          cleaned = Object.fromEntries(
            Object.entries(cleaned).filter(([_, v]) => typeof v !== 'object' || (v && Object.keys(v).length > 0))
          );
        }

        // Log the tool usage
        await ctx.prisma.toolLog.create({
          data: {
            user_id: ctx.user?.id || '',
            api_key_id: ctx.apiKey?.id || '',
            tool_name: 'clean-json',
            tool_version: 'v1',
            input_payload: input,
            output_payload: cleaned,
            status: 'success',
          },
        });

        return cleaned;
      } catch (error) {
        throw new Error('Invalid JSON input');
      }
    }),

  // Check CSV endpoint
  checkCsv: apiKeyProcedure
    .input(CheckCsvInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const lines = input.csv.split('\n');
        const headers = lines[0].split(',');
        const issues = [];

        if (input.options?.checkHeaders) {
          // Check for duplicate headers
          const uniqueHeaders = new Set(headers);
          if (uniqueHeaders.size !== headers.length) {
            issues.push('Duplicate headers found');
          }
        }

        if (input.options?.validateData) {
          // Check each row has the same number of columns as headers
          for (let i = 1; i < lines.length; i++) {
            const columns = lines[i].split(',');
            if (columns.length !== headers.length) {
              issues.push(`Row ${i} has ${columns.length} columns, expected ${headers.length}`);
            }
          }
        }

        // Log the tool usage
        await ctx.prisma.toolLog.create({
          data: {
            user_id: ctx.user?.id || '',
            api_key_id: ctx.apiKey?.id || '',
            tool_name: 'check-csv',
            tool_version: 'v1',
            input_payload: input,
            output_payload: { issues },
            status: 'success',
          },
        });

        return { issues };
      } catch (error) {
        throw new Error('Invalid CSV input');
      }
    }),

  // Summarize endpoint
  summarize: apiKeyProcedure
    .input(SummarizeInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const sentences = input.text.split(/[.!?]+/).filter(Boolean);
        let summary = '';

        if (input.options?.format === 'bullet') {
          summary = sentences
            .slice(0, input.options?.maxLength || 3)
            .map(s => `• ${s.trim()}`)
            .join('\n');
        } else {
          summary = sentences
            .slice(0, input.options?.maxLength || 3)
            .join('. ') + '.';
        }

        // Log the tool usage
        await ctx.prisma.toolLog.create({
          data: {
            user_id: ctx.user?.id || '',
            api_key_id: ctx.apiKey?.id || '',
            tool_name: 'summarize',
            tool_version: 'v1',
            input_payload: input,
            output_payload: { summary },
            status: 'success',
          },
        });

        return { summary };
      } catch (error) {
        throw new Error('Invalid text input');
      }
    }),
}); 