import { NextRequest, NextResponse } from 'next/server';
import { summarizeTool } from '@/tools/summarize';
import { ErrorResponseSchema, ErrorCode } from '@/schemas/summarizeSchema';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Simple in-memory rate limiting (replace with Redis/DB in production)
const RATE_LIMIT = 100; // requests per hour
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(apiKey: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  
  let limit = rateLimitMap.get(apiKey);
  if (!limit || limit.resetTime < hourAgo) {
    limit = { count: 0, resetTime: now + 60 * 60 * 1000 };
  }
  
  const remaining = Math.max(0, RATE_LIMIT - limit.count);
  const allowed = remaining > 0;
  
  if (allowed) {
    limit.count++;
    rateLimitMap.set(apiKey, limit);
  }
  
  return { allowed, remaining, resetTime: limit.resetTime };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = summarizeTool.inputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          code: ErrorCode.INVALID_INPUT,
          detail: parsed.error.message,
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        },
        { status: 400 }
      );
    }

    const result = await summarizeTool.handler(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing summarize request:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        code: ErrorCode.PROCESSING_ERROR,
        detail: 'Failed to process the summarize request',
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const inputSchema = zodToJsonSchema(summarizeTool.inputSchema, {
      $refStrategy: 'none',
      name: 'SummarizeRequest',
      definitionPath: 'definitions',
      target: 'openApi3'
    });

    const outputSchema = zodToJsonSchema(summarizeTool.outputSchema, {
      $refStrategy: 'none',
      name: 'SummarizeResponse',
      definitionPath: 'definitions',
      target: 'openApi3'
    });

    const errorSchema = zodToJsonSchema(ErrorResponseSchema, {
      $refStrategy: 'none',
      name: 'ErrorResponse',
      definitionPath: 'definitions',
      target: 'openApi3'
    });

    return NextResponse.json({
      openapi: '3.0.0',
      info: {
        title: 'Summarize API',
        version: summarizeTool.version,
        description: summarizeTool.description
      },
      components: {
        schemas: {
          SummarizeRequest: inputSchema,
          SummarizeResponse: outputSchema,
          ErrorResponse: errorSchema
        }
      },
      paths: {
        '/api/v1/summarize': {
          post: {
            operationId: 'summarize',
            summary: 'Summarize text',
            description: 'Summarizes the provided text. Requires a valid API key in the x-api-key header.',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/SummarizeRequest'
                  }
                }
              }
            },
            responses: {
              '200': {
                description: 'Successful summarization',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/SummarizeResponse'
                    }
                  }
                }
              },
              '400': {
                description: 'Invalid input',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse'
                    }
                  }
                }
              },
              '500': {
                description: 'Server error',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse'
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error generating OpenAPI schema:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate API documentation',
        code: ErrorCode.PROCESSING_ERROR,
        detail: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      },
      { status: 500 }
    );
  }
} 