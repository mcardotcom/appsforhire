import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getApiKeyFromRequest } from './utils/auth';
import { rateLimiter } from './utils/rate-limiter';
import { edgeLogger } from './utils/edge-logger';

export async function middleware(request: NextRequest) {
  try {
    // Skip rate limiting for non-API routes
    if (!request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.next();
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
    edgeLogger.error('Middleware error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export const config = {
  matcher: '/api/:path*',
}; 