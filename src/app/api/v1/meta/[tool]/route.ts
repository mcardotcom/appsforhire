import { NextRequest, NextResponse } from 'next/server';
import { tools, ToolName } from '@/meta/tools.config';
import { zodToJsonSchema } from 'zod-to-json-schema';

export async function GET(
  request: NextRequest,
  { params }: { params: { tool: string } }
) {
  const tool = tools[params.tool as ToolName];
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
    name: `${tool.name}Request`
  });

  const outputSchema = zodToJsonSchema(tool.outputSchema, {
    $refStrategy: 'none',
    target: 'jsonSchema7',
    name: `${tool.name}Response`
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
      [tool.endpoint]: {
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
                  type: 'object',
                  properties: {
                    json: {
                      type: 'string',
                      description: 'The JSON string to clean'
                    },
                    options: {
                      type: 'object',
                      properties: {
                        removeNulls: {
                          type: 'boolean',
                          default: true,
                          description: 'Remove null values'
                        },
                        removeEmptyArrays: {
                          type: 'boolean',
                          default: true,
                          description: 'Remove empty arrays'
                        },
                        removeEmptyObjects: {
                          type: 'boolean',
                          default: true,
                          description: 'Remove empty objects'
                        },
                        removeEmptyStrings: {
                          type: 'boolean',
                          default: true,
                          description: 'Remove empty strings'
                        },
                        normalizeTypes: {
                          type: 'boolean',
                          default: true,
                          description: 'Normalize data types'
                        },
                        includeOriginal: {
                          type: 'boolean',
                          default: false,
                          description: 'Include original input in response'
                        }
                      }
                    }
                  },
                  required: ['json']
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
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                        description: 'Whether the operation was successful'
                      },
                      data: {
                        type: ['object', 'null'],
                        description: 'The cleaned JSON data'
                      },
                      metadata: {
                        type: 'object',
                        properties: {
                          fieldsProcessed: {
                            type: 'integer',
                            description: 'Number of fields processed'
                          },
                          fieldsRemoved: {
                            type: 'integer',
                            description: 'Number of fields removed'
                          },
                          fieldsNormalized: {
                            type: 'integer',
                            description: 'Number of fields normalized'
                          },
                          warnings: {
                            type: 'array',
                            items: {
                              type: 'string'
                            },
                            description: 'Any warnings during processing'
                          }
                        }
                      },
                      error: {
                        type: ['object', 'null'],
                        description: 'Error information if operation failed'
                      },
                      original: {
                        type: ['object', 'string', 'null'],
                        description: 'Original input if includeOriginal is true'
                      }
                    },
                    required: ['success', 'metadata', 'original']
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
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        [`${tool.name}Request`]: {
          type: 'object',
          properties: {
            json: {
              type: 'string',
              description: 'The JSON string to clean'
            },
            options: {
              type: 'object',
              properties: {
                removeNulls: {
                  type: 'boolean',
                  default: true,
                  description: 'Remove null values'
                },
                removeEmptyArrays: {
                  type: 'boolean',
                  default: true,
                  description: 'Remove empty arrays'
                },
                removeEmptyObjects: {
                  type: 'boolean',
                  default: true,
                  description: 'Remove empty objects'
                },
                removeEmptyStrings: {
                  type: 'boolean',
                  default: true,
                  description: 'Remove empty strings'
                },
                normalizeTypes: {
                  type: 'boolean',
                  default: true,
                  description: 'Normalize data types'
                },
                includeOriginal: {
                  type: 'boolean',
                  default: false,
                  description: 'Include original input in response'
                }
              }
            }
          },
          required: ['json']
        },
        [`${tool.name}Response`]: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether the operation was successful'
            },
            data: {
              type: ['object', 'null'],
              description: 'The cleaned JSON data'
            },
            metadata: {
              type: 'object',
              properties: {
                fieldsProcessed: {
                  type: 'integer',
                  description: 'Number of fields processed'
                },
                fieldsRemoved: {
                  type: 'integer',
                  description: 'Number of fields removed'
                },
                fieldsNormalized: {
                  type: 'integer',
                  description: 'Number of fields normalized'
                },
                warnings: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Any warnings during processing'
                }
              }
            },
            error: {
              type: ['object', 'null'],
              description: 'Error information if operation failed'
            },
            original: {
              type: ['object', 'string', 'null'],
              description: 'Original input if includeOriginal is true'
            }
          },
          required: ['success', 'metadata', 'original']
        }
      }
    }
  });
} 