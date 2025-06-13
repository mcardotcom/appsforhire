import { z } from 'zod';
import { router, supabaseProcedure } from '../trpc';
import { handleSupabaseError } from '../../utils/supabase';
import { generateApiKey } from '../../utils/api-key';

export const apiKeyRouter = router({
  list: supabaseProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const { data, error } = await ctx.supabase
          .from('api_keys')
          .select('*')
          .eq('user_id', input.userId);

        if (error) {
          return handleSupabaseError(error);
        }

        return data;
      } catch (error) {
        console.error('Error listing API keys:', error);
        return {
          error: {
            message: 'An error occurred while listing API keys',
            code: 'INTERNAL_ERROR',
          },
        };
      }
    }),

  create: supabaseProcedure
    .input(
      z.object({
        userId: z.string(),
        name: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const apiKey = generateApiKey();
        const { data, error } = await ctx.supabase
          .from('api_keys')
          .insert({
            user_id: input.userId,
            name: input.name,
            key: apiKey,
            rate_limit_per_minute: 100,
            burst_limit: 10,
            window_seconds: 60,
          })
          .select()
          .single();

        if (error) {
          return handleSupabaseError(error);
        }

        return data;
      } catch (error) {
        console.error('Error creating API key:', error);
        return {
          error: {
            message: 'An error occurred while creating API key',
            code: 'INTERNAL_ERROR',
          },
        };
      }
    }),

  update: supabaseProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        rateLimitPerMinute: z.number().optional(),
        burstLimit: z.number().optional(),
        windowSeconds: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { data, error } = await ctx.supabase
          .from('api_keys')
          .update({
            name: input.name,
            rate_limit_per_minute: input.rateLimitPerMinute,
            burst_limit: input.burstLimit,
            window_seconds: input.windowSeconds,
          })
          .eq('id', input.id)
          .select()
          .single();

        if (error) {
          return handleSupabaseError(error);
        }

        return data;
      } catch (error) {
        console.error('Error updating API key:', error);
        return {
          error: {
            message: 'An error occurred while updating API key',
            code: 'INTERNAL_ERROR',
          },
        };
      }
    }),

  delete: supabaseProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { error } = await ctx.supabase
          .from('api_keys')
          .delete()
          .eq('id', input.id);

        if (error) {
          return handleSupabaseError(error);
        }

        return { success: true };
      } catch (error) {
        console.error('Error deleting API key:', error);
        return {
          error: {
            message: 'An error occurred while deleting API key',
            code: 'INTERNAL_ERROR',
          },
        };
      }
    }),
}); 