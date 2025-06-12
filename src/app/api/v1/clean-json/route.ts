import { NextRequest, NextResponse } from 'next/server';
import { cleanJsonTool } from '@/tools/clean-json';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Convert Zod schemas to JSON Schema format
const inputSchema = zodToJsonSchema(cleanJsonTool.inputSchema, {
  $refStrategy: 'none',
  target: 'jsonSchema7',
  name: 'CleanJsonRequest',
  basePath: ['components', 'schemas']
});

const outputSchema = zodToJsonSchema(cleanJsonTool.outputSchema, {
  $refStrategy: 'none',
  target: 'jsonSchema7',
  name: 'CleanJsonResponse',
  basePath: ['components', 'schemas']
});

const errorSchema = {
  type: 'object',
  properties: {
    success: {
      type: 'boolean',
      description: 'Whether the operation was successful'
    },
    error: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Error message'
        },
        code: {
          type: 'string',
          description: 'Error code'
        },
        details: {
          type: 'object',
          description: 'Detailed error information'
        }
      },
      required: ['message', 'code']
    },
    metadata: {
      type: 'object',
      properties: {
        fieldsProcessed: {
          type: 'number',
          description: 'Number of fields processed'
        },
        fieldsRemoved: {
          type: 'number',
          description: 'Number of fields removed'
        },
        fieldsNormalized: {
          type: 'number',
          description: 'Number of fields normalized'
        },
        warnings: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'List of warnings'
        }
      },
      required: ['fieldsProcessed', 'fieldsRemoved', 'fieldsNormalized', 'warnings']
    },
    original: {
      type: ['object', 'null'],
      description: 'Original input data'
    }
  },
  required: ['success', 'error', 'metadata', 'original']
};

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

    const body = await request.json();
    const parsed = cleanJsonTool.inputSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Invalid input format',
          code: 'INVALID_INPUT',
          details: parsed.error
        },
        metadata: {
          fieldsProcessed: 0,
          fieldsRemoved: 0,
          fieldsNormalized: 0,
          warnings: []
        },
        original: null,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      }, { status: 400 });
    }

    const result = await cleanJsonTool.handler(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      metadata: {
        fieldsProcessed: 0,
        fieldsRemoved: 0,
        fieldsNormalized: 0,
        warnings: []
      },
      original: null,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    }, { status: 500 });
  }
}

// OpenAPI schema
export const openapi = {
  openapi: "3.1.0",
  info: {
    title: "Clean JSON API",
    description: "API for cleaning and normalizing JSON data",
    version: "1.0.0"
  },
  servers: [
    {
      url: "https://1c65-2603-9000-f300-1662-2e6e-f657-9710-a10.ngrok-free.app",
      description: "API Server"
    }
  ],
  components: {
    schemas: {
      CleanJsonRequest: inputSchema,
      CleanJsonResponse: outputSchema,
      ErrorResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean"
          },
          error: {
            type: "object",
            properties: {
              message: {
                type: "string"
              },
              code: {
                type: "string"
              },
              details: {
                type: "object"
              }
            },
            required: ["message", "code"]
          },
          metadata: {
            type: "object",
            properties: {
              fieldsProcessed: {
                type: "number"
              },
              fieldsRemoved: {
                type: "number"
              },
              fieldsNormalized: {
                type: "number"
              },
              warnings: {
                type: "array",
                items: {
                  type: "string"
                }
              }
            },
            required: ["fieldsProcessed", "fieldsRemoved", "fieldsNormalized", "warnings"]
          },
          original: {
            type: ["object", "null"]
          },
          timestamp: {
            type: "string",
            format: "date-time"
          },
          requestId: {
            type: "string",
            format: "uuid"
          }
        },
        required: ["success", "error", "metadata", "original", "timestamp", "requestId"]
      }
    },
    securitySchemes: {
      apiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
        description: "API key for authentication. Required for all requests."
      }
    }
  },
  security: [
    {
      apiKeyAuth: []
    }
  ],
  paths: {
    "/api/v1/clean-json": {
      post: {
        operationId: "cleanJson",
        summary: "Clean JSON data",
        description: "Cleans and normalizes JSON data by removing invalid fields and normalizing values. Requires a valid API key.",
        security: [
          {
            apiKeyAuth: []
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CleanJsonRequest"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CleanJsonResponse"
                }
              }
            }
          },
          "400": {
            description: "Bad request - invalid input",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "401": {
            description: "Unauthorized - missing or invalid API key",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "403": {
            description: "Forbidden - invalid API key",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "413": {
            description: "Payload too large",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    }
  }
}; 