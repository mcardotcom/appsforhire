import { NextRequest, NextResponse } from 'next/server';
import { cleanJsonTool } from '@/tools/clean-json';
import { openapi } from './openapi';

// Simple in-memory rate limiting
const rateLimits = new Map<string, { count: number; resetTime: number }>();
const REQUESTS_PER_HOUR = 100;

function checkRateLimit(apiKey: string) {
  const now = Date.now();
  const limit = rateLimits.get(apiKey);

  if (!limit || now > limit.resetTime) {
    rateLimits.set(apiKey, {
      count: 1,
      resetTime: now + 3600000 // 1 hour
    });
    return { allowed: true, remaining: REQUESTS_PER_HOUR - 1, resetTime: now + 3600000 };
  }

  if (limit.count >= REQUESTS_PER_HOUR) {
    return { allowed: false, remaining: 0, resetTime: limit.resetTime };
  }

  limit.count++;
  return { allowed: true, remaining: REQUESTS_PER_HOUR - limit.count, resetTime: limit.resetTime };
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    const { allowed, remaining, resetTime } = checkRateLimit(apiKey);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime.toString()
          }
        }
      );
    }

    const body = await req.json();
    
    // Validate input against schema
    const parsed = cleanJsonTool.inputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid input format',
            details: parsed.error
          }
        },
        { status: 400 }
      );
    }

    const result = await cleanJsonTool.handler(parsed.data);

    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetTime.toString()
      }
    });
  } catch (error) {
    console.error('Error in clean-json route:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to process request'
        }
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(openapi);
} 