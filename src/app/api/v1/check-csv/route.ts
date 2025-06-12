import { NextRequest, NextResponse } from 'next/server';
import { checkCsvTool } from '@/tools/check-csv';
import { openapi } from './openapi';

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function checkRateLimit(apiKey: string) {
  const now = Date.now();
  const limit = rateLimitMap.get(apiKey);

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(apiKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetTime: now + RATE_LIMIT_WINDOW };
  }

  if (limit.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetTime: limit.resetTime };
  }

  limit.count++;
  return { allowed: true, remaining: RATE_LIMIT - limit.count, resetTime: limit.resetTime };
}

export async function POST(req: NextRequest) {
  try {
    // Check API key
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_API_KEY', message: 'API key is required' } },
        { status: 401 }
      );
    }

    // Check rate limit
    const rateLimit = checkRateLimit(apiKey);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded' } },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString()
          }
        }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const validationResult = checkCsvTool.inputSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_INPUT', 
            message: 'Invalid input format',
            details: validationResult.error.format()
          }
        },
        { status: 400 }
      );
    }

    // Process the request
    const result = await checkCsvTool.handler(validationResult.data);

    // Return response with rate limit headers
    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'PROCESSING_ERROR', 
          message: 'Error processing request',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(openapi);
} 