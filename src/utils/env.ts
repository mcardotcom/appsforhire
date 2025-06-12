import { z } from 'zod';

const envSchema = z.object({
  // Required variables
  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  
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

// Parse and validate environment variables
export const env = envSchema.parse(process.env);

// Type for the environment variables
export type Env = z.infer<typeof envSchema>; 