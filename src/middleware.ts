import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/database.types';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getApiKeyFromRequest } from './utils/auth';
import { rateLimiter } from './utils/rate-limiter';
import { edgeLogger } from './utils/edge-logger';

// Check if all required environment variables are present
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.warn('NEXT_PUBLIC_SUPABASE_URL is missing');
}

if (!supabaseAnonKey) {
  console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
}

if (!supabaseServiceRoleKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is missing');
}

// Only create clients if environment variables are available
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null;

export const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Helper function to ensure Supabase is available
export function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase client is not initialized. Check your environment variables.');
  }
  return supabase;
}

export function requireSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client is not initialized. Check your environment variables.');
  }
  return supabaseAdmin;
}

// Middleware function
export async function middleware(request: NextRequest) {
  // Skip middleware for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Skip middleware for static files
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/static')
  ) {
    return NextResponse.next();
  }

  try {
    // Only proceed with auth checks if Supabase is initialized
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();

      // Allow access to auth routes when not logged in
      if (request.nextUrl.pathname.startsWith('/auth')) {
        // If user is already logged in and tries to access auth pages, redirect to home
        if (session && request.nextUrl.pathname !== '/auth/logout') {
          return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
      }

      // Allow access to landing page and public routes
      if (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/public')) {
        return NextResponse.next();
      }

      // Redirect to auth page if not authenticated and trying to access protected routes
      if (!session) {
        return NextResponse.redirect(new URL('/auth', request.url));
      }
    }

    // Allow summarization endpoint without API key for testing
    if (request.nextUrl.pathname.startsWith('/api/v1/summarize')) {
      return NextResponse.next();
    }

    const apiKey = await getApiKeyFromRequest(request);
    if (!apiKey) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check burst limit first
    const burstAllowed = await rateLimiter.checkBurstLimit(apiKey.id, {
      rateLimitPerMinute: apiKey.rate_limit_per_minute,
      burstLimit: apiKey.burst_limit,
      windowSeconds: apiKey.window_seconds,
    });

    if (!burstAllowed) {
      edgeLogger.warn('Burst limit exceeded', { apiKey: apiKey.id });
      return new NextResponse('Too Many Requests', { status: 429 });
    }

    // Then check rate limit
    const rateAllowed = await rateLimiter.checkRateLimit(apiKey.id, {
      rateLimitPerMinute: apiKey.rate_limit_per_minute,
      burstLimit: apiKey.burst_limit,
      windowSeconds: apiKey.window_seconds,
    });

    if (!rateAllowed) {
      edgeLogger.warn('Rate limit exceeded', { apiKey: apiKey.id });
      return new NextResponse('Too Many Requests', { status: 429 });
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // Don't block the request if there's an error
    return NextResponse.next();
  }
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 