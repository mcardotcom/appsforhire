import { NextRequest, NextResponse } from 'next/server';
import { tools, ToolName } from '@/meta/tools.config';
import { zodToJsonSchema } from 'zod-to-json-schema';

export async function GET(
  request: NextRequest,
  context: { params: { tool: string } }
) {
  try {
    const { tool: toolName } = context.params;
    const tool = tools[toolName as ToolName];
    
    if (!tool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }

    // Convert Zod schemas to JSON Schema format
    const inputSchema = zodToJsonSchema(tool.inputSchema, {
      $refStrategy: 'none',
      target: 'jsonSchema7',
      name: `${tool.name}Request`,
      basePath: ['components', 'schemas']
    });

    const outputSchema = zodToJsonSchema(tool.outputSchema, {
      $refStrategy: 'none',
      target: 'jsonSchema7',
      name: `${tool.name}Response`,
      basePath: ['components', 'schemas']
    });

    // Return OpenAPI 3.1.0 specification
    return NextResponse.json({
      openapi: '3.1.0',
      info: {
        title: `${tool.name.charAt(0).toUpperCase() + tool.name.slice(1)} API`,
        description: tool.description,
        version: tool.version
      },
      servers: [
        {
          url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
          description: 'API Server'
        }
      ],
      paths: {
        [`/api/v1/${tool.name}`]: {
          post: {
            operationId: tool.name,
            summary: tool.description,
            description: tool.description,
            security: [
              { bearerAuth: [] }
            ],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    $ref: `#/components/schemas/${tool.name}Request`
                  }
                }
              }
            },
            responses: {
              '200': {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: `#/components/schemas/${tool.name}Response`
                    }
                  }
                }
              },
              '400': {
                description: 'Bad request - invalid input',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse'
                    }
                  }
                }
              },
              '401': {
                description: 'Unauthorized - invalid or missing API key',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse'
                    }
                  }
                }
              },
              '500': {
                description: 'Internal server error',
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
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'API key for authentication'
          }
        },
        schemas: {
          [`${tool.name}Request`]: inputSchema,
          [`${tool.name}Response`]: outputSchema,
          'ErrorResponse': {
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
          }
        }
      }
    });
  } catch (error) {
    console.error('Error generating API metadata:', error);
    return NextResponse.json(
      { error: 'Internal server error', detail: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 