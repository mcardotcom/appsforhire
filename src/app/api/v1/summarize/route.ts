import { NextRequest, NextResponse } from 'next/server';
import { summarizeTool } from '@/tools/summarize';
import { ErrorResponseSchema } from '@/schemas/summarizeSchema';
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

export async function POST(request: NextRequest) {
  try {
    // Log all headers for debugging
    console.log('All request headers:', Object.fromEntries(request.headers.entries()));
    
    // Check API key from both headers
    const authHeader = request.headers.get('Authorization');
    const xApiKey = request.headers.get('x-api-key');
    
    // Extract API key from Authorization header (Bearer token) or use x-api-key
    const apiKey = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : xApiKey;
    
    console.log('API key from x-api-key header:', xApiKey);
    console.log('Authorization header:', authHeader);
    console.log('Extracted API key:', apiKey);
    
    if (!apiKey) {
      console.log('No API key found in either header');
      return NextResponse.json(
        {
          error: 'Unauthorized',
          code: 'INVALID_INPUT',
          detail: 'Missing API key',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        },
        { status: 401 }
      );
    }

    // Check rate limit
    const rateLimit = checkRateLimit(apiKey);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          detail: `Please try again in ${Math.ceil((rateLimit.resetTime - Date.now()) / 1000)} seconds`,
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetTime.toString()
          }
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parsed = summarizeTool.inputSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          code: 'INVALID_INPUT',
          detail: parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        },
        { status: 400 }
      );
    }

    // Process the request
    const result = await summarizeTool.handler(parsed.data);

    // Return response with rate limit headers
    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Limit': RATE_LIMIT.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    });
  } catch (error) {
    console.error('Error processing summarize request:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        detail: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      },
      { status: 500 }
    );
  }
}

// Convert Zod schemas to JSON Schema format
const inputSchema = zodToJsonSchema(summarizeTool.inputSchema, {
  $refStrategy: 'none',
  target: 'jsonSchema7',
  name: 'SummarizeRequest',
  basePath: ['components', 'schemas']
});

const outputSchema = zodToJsonSchema(summarizeTool.outputSchema, {
  $refStrategy: 'none',
  target: 'jsonSchema7',
  name: 'SummarizeResponse',
  basePath: ['components', 'schemas']
});

const errorSchema = zodToJsonSchema(ErrorResponseSchema, {
  $refStrategy: 'none',
  target: 'jsonSchema7',
  name: 'ErrorResponse',
  basePath: ['components', 'schemas']
});

const responses = {
  "200": {
    "description": "Success",
    "content": {
      "application/json": {
        "schema": {
          "type": "object",
          "properties": {
            "summary": {
              "type": "string"
            }
          }
        }
      }
    }
  },
  "400": {
    "description": "Error",
    "content": {
      "application/json": {
        "schema": {
          "type": "object",
          "properties": {
            "error": {
              "type": "string"
            }
          }
        }
      }
    }
  }
};

// OpenAPI schema
export const openapi = {
  "openapi": "3.1.0",
  "info": {
    "title": "Summarize API",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "https://1c65-2603-9000-f300-1662-2e6e-f657-9710-a10.ngrok-free.app"
    }
  ],
  "components": {
    "schemas": {
      "SummarizeRequest": {
        "type": "object",
        "required": ["text"],
        "properties": {
          "text": {
            "type": "string",
            "description": "Text to summarize"
          },
          "maxLength": {
            "type": "integer",
            "default": 200
          }
        }
      },
      "SummarizeResponse": {
        "type": "object",
        "properties": {
          "summary": {
            "type": "string"
          }
        }
      },
      "ErrorResponse": {
        "type": "object",
        "properties": {
          "error": {
            "type": "string"
          },
          "code": {
            "type": "string"
          },
          "detail": {
            "type": "string"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          },
          "requestId": {
            "type": "string",
            "format": "uuid"
          }
        }
      }
    },
    "securitySchemes": {
      "apiKeyAuth": {
        "type": "apiKey",
        "in": "header",
        "name": "x-api-key",
        "description": "API key for authentication. Required for all requests."
      }
    }
  },
  "security": [
    {
      "apiKeyAuth": []
    }
  ],
  "paths": {
    "/api/v1/summarize": {
      "post": {
        "operationId": "summarize",
        "summary": "Summarize text",
        "description": "Summarizes the provided text. Requires a valid API key in the x-api-key header.",
        "security": [
          {
            "apiKeyAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/SummarizeRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/SummarizeResponse"
                }
              }
            }
          },
          "400": {
            "description": "Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized - missing or invalid API key",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden - invalid API key",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    }
  }
} as const; 