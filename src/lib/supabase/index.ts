import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/database.types';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Validate environment variables
const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NODE_ENV: process.env.NODE_ENV,
});

// Create clients with validated environment variables
const createSupabaseClient = (type: 'anon' | 'admin') => {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = type === 'admin' 
    ? env.SUPABASE_SERVICE_ROLE_KEY 
    : env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: type === 'anon',
      persistSession: type === 'anon',
      detectSessionInUrl: type === 'anon'
    }
  });
};

// Initialize clients
export const supabase = createSupabaseClient('anon');
export const supabaseAdmin = createSupabaseClient('admin');

// Helper functions that return the initialized clients
export function getSupabase() {
  return supabase;
}

export function getSupabaseAdmin() {
  return supabaseAdmin;
}

// Error handling utility
export function handleSupabaseError(error: unknown, context: string) {
  // Only log detailed errors in development
  if (env.NODE_ENV === 'development') {
    console.error(`Error in ${context}:`, {
      message: error instanceof Error ? error.message : String(error),
      code: error instanceof TRPCError ? error.code : 'UNKNOWN',
      stack: error instanceof Error ? error.stack : undefined
    });
  }

  // Handle rate limiting errors
  if (error instanceof Error && error.message?.includes('you can only request this after')) {
    const match = error.message.match(/after (\d+) seconds/);
    const seconds = match ? parseInt(match[1], 10) : 60;
    
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded. Please try again after ${seconds} seconds.`,
      cause: error
    });
  }

  // Handle auth errors
  if (error instanceof Error && error.message?.includes('already registered')) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'A user with this email address has already been registered',
      cause: error
    });
  }

  // Handle other errors
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    cause: error
  });
} 