import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/utils/supabaseClient';

export async function middleware(request: NextRequest) {
  // Skip middleware for non-API routes
  if (!request.nextUrl.pathname.startsWith('/api/v1/')) {
    return NextResponse.next();
  }

  // Skip middleware for meta endpoint
  if (request.nextUrl.pathname.startsWith('/api/v1/meta/')) {
    return NextResponse.next();
  }

  // Get API key from either Authorization header or x-api-key header
  const authHeader = request.headers.get('Authorization');
  const xApiKey = request.headers.get('x-api-key');
  
  // Extract API key from Authorization header (Bearer token) or use x-api-key
  const apiKey = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : xApiKey;

  console.log('Received headers:', { authHeader, xApiKey });
  console.log('Extracted API key:', apiKey);

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key is required' },
      { status: 401 }
    );
  }

  // Validate API key against Supabase
  const { data: apiKeyData, error: apiKeyError } = await supabase
    .from('ApiKey')
    .select('*')
    .eq('key', apiKey)
    .eq('is_active', true)
    .single();

  console.log('Supabase query result:', { apiKeyData, apiKeyError });

  if (apiKeyError || !apiKeyData) {
    return NextResponse.json(
      { error: 'Invalid or inactive API key' },
      { status: 403 }
    );
  }

  // Check rate limit
  const now = new Date();
  const windowStart = new Date(now.getTime() - apiKeyData.window_seconds * 1000);
  
  const { count: recentRequests } = await supabase
    .from('tool_logs')
    .select('*', { count: 'exact', head: true })
    .eq('api_key_id', apiKeyData.id)
    .gte('created_at', windowStart.toISOString());

  if (recentRequests && recentRequests >= apiKeyData.rate_limit_per_minute) {
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Rate limit exceeded',
          code: 'RATE_001'
        },
        metadata: {
          fieldsProcessed: 0,
          fieldsRemoved: 0,
          fieldsNormalized: 0,
          warnings: []
        },
        original: null
      },
      { status: 429 }
    );
  }

  // Update last_request_at
  await supabase
    .from('api_keys')
    .update({ last_request_at: now.toISOString() })
    .eq('id', apiKeyData.id);

  // Add API key info to request headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-api-key-id', apiKeyData.id);
  requestHeaders.set('x-user-id', apiKeyData.user_id);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: '/api/v1/:path*',
}; 