import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { handleSupabaseError } from '@/lib/supabase';
import { generateApiKey } from '@/utils/api-key';
import { getSupabaseAdmin } from '@/lib/supabase';
import { TRPCError } from '@trpc/server';

// Password validation schema
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Rate limit configuration
const RATE_LIMIT = {
  DEFAULT: 100,
  BURST: 10,
  WINDOW: 60,
};

export const authRouter = router({
  signup: publicProcedure
    .input(
      z.object({
        email: z.string().email('Invalid email address'),
        password: passwordSchema,
      })
    )
    .mutation(async ({ input }) => {
      const supabaseAdmin = getSupabaseAdmin();
      
      try {
        // Step 1: Create user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: input.email,
          password: input.password,
          email_confirm: false, // Require email confirmation
        });
        
        if (authError) {
          return handleSupabaseError(authError, 'auth.admin.createUser');
        }
        
        if (!authData.user) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create user',
          });
        }

        // Step 2: Create user record in database
        const { data: user, error: userError } = await supabaseAdmin
          .from('users')
          .insert({
            id: authData.user.id,
            email: input.email,
          })
          .select()
          .single();

        if (userError) {
          // Clean up auth user if database insert fails
          try {
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          } catch (deleteError) {
            // Log cleanup error but don't expose it
            console.error('Failed to clean up auth user:', deleteError);
          }
          return handleSupabaseError(userError, 'users.insert');
        }

        // Step 3: Generate and create API key
        const apiKey = generateApiKey();
        const { data: apiKeyData, error: apiKeyError } = await supabaseAdmin
          .from('api_keys')
          .insert({
            user_id: user.id,
            name: 'Default API Key',
            key: apiKey,
            rate_limit_per_minute: RATE_LIMIT.DEFAULT,
            burst_limit: RATE_LIMIT.BURST,
            window_seconds: RATE_LIMIT.WINDOW,
          })
          .select()
          .single();

        if (apiKeyError) {
          // Clean up user record if API key creation fails
          try {
            await supabaseAdmin
              .from('users')
              .delete()
              .eq('id', user.id);
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          } catch (deleteError) {
            console.error('Failed to clean up records:', deleteError);
          }
          return handleSupabaseError(apiKeyError, 'api_keys.insert');
        }

        // Step 4: Create initial usage summary
        const currentDate = new Date();
        const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        
        const { data: usageSummary, error: usageError } = await supabaseAdmin
          .from('usage_summaries')
          .insert({
            user_id: user.id,
            month_year: monthYear,
            total_calls: 0,
            total_tokens: 0,
          })
          .select()
          .single();

        if (usageError) {
          // Clean up all records if usage summary creation fails
          try {
            await supabaseAdmin
              .from('api_keys')
              .delete()
              .eq('id', apiKeyData.id);
            await supabaseAdmin
              .from('users')
              .delete()
              .eq('id', user.id);
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          } catch (deleteError) {
            console.error('Failed to clean up records:', deleteError);
          }
          return handleSupabaseError(usageError, 'usage_summaries.insert');
        }

        // Return success response without exposing sensitive data
        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
          },
          apiKey: {
            id: apiKeyData.id,
            name: apiKeyData.name,
            key: apiKey, // Only return the key once
          },
        };
      } catch (error) {
        return handleSupabaseError(error, 'signup');
      }
    }),
}); 