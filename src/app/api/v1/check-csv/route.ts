import { NextRequest, NextResponse } from 'next/server';
import { checkCsvTool } from '@/tools/check-csv';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Convert Zod schemas to JSON Schema format
const inputSchema = zodToJsonSchema(checkCsvTool.inputSchema, {
  $refStrategy: 'none',
  target: 'jsonSchema7',
  name: 'CheckCsvRequest',
  basePath: ['components', 'schemas']
});

const outputSchema = zodToJsonSchema(checkCsvTool.outputSchema, {
  $refStrategy: 'none',
  target: 'jsonSchema7',
  name: 'CheckCsvResponse',
  basePath: ['components', 'schemas']
});

const errorSchema = {
  type: 'object',
  properties: {
    error: {
      type: 'string',
      description: 'Error message'
    },
    detail: {
      type: 'string',
      description: 'Detailed error information'
    }
  },
  required: ['error']
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
    
    // Check if the request body has the correct structure
    if (!body.csv && !body.json) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          code: 'INVALID_INPUT',
          detail: 'Request body must contain either a "csv" or "json" field',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        },
        { status: 400 }
      );
    }

    // Transform the input if it's using the json field
    const input = {
      csv: body.csv || body.json,
      options: body.options || {}
    };
    
    // Validate input using the tool's schema
    const validatedInput = checkCsvTool.inputSchema.parse(input);
    
    // Process the CSV data
    const result = await checkCsvTool.handler(validatedInput);
    
    // Validate output using the tool's schema
    const validatedOutput = checkCsvTool.outputSchema.parse(result);
    
    return NextResponse.json(validatedOutput);
  } catch (error) {
    console.error('Error processing CSV:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          code: 'INVALID_INPUT',
          detail: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        },
        { status: 400 }
      );
    }
    
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

// OpenAPI schema
export const openapi = {
  openapi: "3.1.0",
  info: {
    title: "Check CSV API",
    description: "API for validating and checking CSV data",
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
      CheckCsvRequest: inputSchema,
      CheckCsvResponse: outputSchema,
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "string"
          },
          code: {
            type: "string"
          },
          detail: {
            type: "string"
          },
          timestamp: {
            type: "string",
            format: "date-time"
          },
          requestId: {
            type: "string",
            format: "uuid"
          }
        }
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
    "/api/v1/check-csv": {
      post: {
        operationId: "checkCsv",
        summary: "Check CSV data",
        description: "Validates and checks CSV data for errors and issues. Requires a valid API key.",
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
                $ref: "#/components/schemas/CheckCsvRequest"
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
                  $ref: "#/components/schemas/CheckCsvResponse"
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