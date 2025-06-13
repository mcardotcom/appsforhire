import { z } from 'zod';

// Log all environment variables (excluding sensitive values)
console.log('Environment variables present:', {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
  NODE_ENV: process.env.NODE_ENV,
});

const envSchema = z.object({
  // Supabase configuration (required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // Optional variables (required in production)
  REDIS_URL: z.string().url().optional(),
  
  // Development-specific variables
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  USE_REDIS: z.string().optional(),
  USE_SECURE_COOKIES: z.string().optional(),
  
  // API configuration
  API_RATE_LIMIT: z.string().transform(Number).optional(),
  API_WINDOW_SECONDS: z.string().transform(Number).optional(),
  API_BURST_LIMIT: z.string().transform(Number).optional(),
});

let env: z.infer<typeof envSchema>;

// Parse and validate environment variables
try {
  env = envSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    REDIS_URL: process.env.REDIS_URL,
    NODE_ENV: process.env.NODE_ENV,
    USE_REDIS: process.env.USE_REDIS,
    USE_SECURE_COOKIES: process.env.USE_SECURE_COOKIES,
    API_RATE_LIMIT: process.env.API_RATE_LIMIT,
    API_WINDOW_SECONDS: process.env.API_WINDOW_SECONDS,
    API_BURST_LIMIT: process.env.API_BURST_LIMIT,
  });
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Environment validation failed:', error.errors);
  }
  throw error;
}

export { env };
export type Env = z.infer<typeof envSchema>; 