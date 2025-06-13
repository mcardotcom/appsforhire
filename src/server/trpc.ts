import { initTRPC, TRPCError } from '@trpc/server';
import { getSupabaseAdmin } from '../utils/supabase';
import type { NextRequest } from 'next/server';

// Create a context type
export type Context = {
  supabase: ReturnType<typeof getSupabaseAdmin>;
  req?: NextRequest;
};

// Create the tRPC instance
const t = initTRPC.context<Context>().create();

// Export reusable router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;

// Create a middleware that adds the Supabase client to the context
const supabaseMiddleware = t.middleware(async ({ next, ctx }) => {
  try {
    const supabase = getSupabaseAdmin(); // This will throw if not configured
    return await next({
      ctx: {
        ...ctx,
        supabase,
      },
    });
  } catch (error) {
    console.error('Supabase middleware error:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : 'Database not configured',
      cause: error,
    });
  }
});

// Create a procedure that uses the Supabase middleware
export const supabaseProcedure = t.procedure.use(supabaseMiddleware);

// Create and export a context function for tRPC handlers
export function createContext({ req }: { req: NextRequest }) {
  console.log('Creating TRPC context...');
  
  try {
    const supabase = getSupabaseAdmin();
    return {
      supabase,
      req,
    };
  } catch (error) {
    console.error('Error creating TRPC context:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Database not configured properly',
      cause: error,
    });
  }
} 