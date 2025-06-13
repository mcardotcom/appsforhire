import { createClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';
import { TRPCError } from '@trpc/server';

// Debug logging for environment variables
console.log('Environment variables in supabase.ts:', {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10) + '...',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10) + '...',
});

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL',
  });
}

if (!supabaseAnonKey) {
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY',
  });
}

if (!supabaseServiceRoleKey) {
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY',
  });
}

// Create clients with validated environment variables
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper functions that return the initialized clients
export function getSupabase() {
  return supabase;
}

export function getSupabaseAdmin() {
  return supabaseAdmin;
}

// For backward compatibility
export { supabase as default };

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any) {
  console.error('Supabase error:', {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
    status: error.status
  });

  // Handle rate limiting errors specifically
  if (error.message?.includes('you can only request this after')) {
    const match = error.message.match(/after (\d+) seconds/);
    const seconds = match ? parseInt(match[1], 10) : 60;
    
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded. Please try again after ${seconds} seconds.`,
      cause: error
    });
  }

  // Handle auth errors
  if (error.status === 400) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: error.message || 'Invalid request',
      cause: error
    });
  }

  // Handle server errors
  if (error.status >= 500) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Database error occurred',
      cause: error
    });
  }

  // Handle other errors
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: error.message || 'An unexpected error occurred',
    cause: error
  });
} 