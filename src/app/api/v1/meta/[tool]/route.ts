import { NextRequest, NextResponse } from 'next/server';
import { cleanJsonTool } from '@/tools/clean-json';
import { checkCsvTool } from '@/tools/check-csv';
import { summarizeTool } from '@/tools/summarize';
import { ErrorResponseSchema } from '@/schemas/summarizeSchema';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Map tool names to their pre-imported modules
const preImportedModules = {
  'clean-json': cleanJsonTool,
  'check-csv': checkCsvTool,
  'summarize': summarizeTool
} as const;

// Map tool names to their OpenAPI schemas
const openapiSchemas = {
  'clean-json': {
    openapi: "3.1.0",
    info: {
      title: "Clean JSON API",
      description: "API for cleaning and normalizing JSON data",
      version: cleanJsonTool.version
    },
    servers: [
      {
        url: "https://1c65-2603-9000-f300-1662-2e6e-f657-9710-a10.ngrok-free.app",
        description: "Production server"
      }
    ],
    components: {
      schemas: {
        CleanJsonRequest: zodToJsonSchema(cleanJsonTool.inputSchema),
        CleanJsonResponse: zodToJsonSchema(cleanJsonTool.outputSchema),
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            error: {
              type: "object",
              properties: {
                message: { type: "string" },
                code: { type: "string" },
                details: { type: "object" }
              },
              required: ["message", "code"]
            },
            metadata: {
              type: "object",
              properties: {
                fieldsProcessed: { type: "number" },
                fieldsRemoved: { type: "number" },
                fieldsNormalized: { type: "number" },
                warnings: {
                  type: "array",
                  items: { type: "string" }
                }
              },
              required: ["fieldsProcessed", "fieldsRemoved", "fieldsNormalized", "warnings"]
            },
            original: { type: ["object", "null"] }
          },
          required: ["success", "error", "metadata", "original"]
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
    security: [{ apiKeyAuth: [] }],
    paths: {
      "/api/v1/clean-json": {
        post: {
          operationId: "cleanJson",
          summary: "Clean JSON data",
          description: "Cleans and normalizes JSON data. Requires a valid API key.",
          security: [{ apiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CleanJsonRequest" }
              }
            }
          },
          responses: {
            "200": {
              description: "Successful operation",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CleanJsonResponse" }
                }
              }
            },
            "400": {
              description: "Invalid input",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" }
                }
              }
            },
            "500": {
              description: "Server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" }
                }
              }
            }
          }
        }
      }
    }
  },
  'check-csv': {
    openapi: "3.1.0",
    info: {
      title: "Check CSV API",
      description: "API for validating and analyzing CSV data",
      version: checkCsvTool.version
    },
    servers: [
      {
        url: "https://1c65-2603-9000-f300-1662-2e6e-f657-9710-a10.ngrok-free.app",
        description: "Production server"
      }
    ],
    components: {
      schemas: {
        CheckCsvRequest: zodToJsonSchema(checkCsvTool.inputSchema),
        CheckCsvResponse: zodToJsonSchema(checkCsvTool.outputSchema),
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            error: {
              type: "object",
              properties: {
                message: { type: "string" },
                code: { type: "string" },
                details: { type: "object" }
              },
              required: ["message", "code"]
            },
            metadata: {
              type: "object",
              properties: {
                processingTime: { type: "number" },
                validationRules: {
                  type: "array",
                  items: { type: "string" }
                },
                sampleData: {
                  type: "array",
                  items: { type: "object" }
                }
              },
              required: ["processingTime", "validationRules"]
            }
          },
          required: ["success", "error", "metadata"]
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
    security: [{ apiKeyAuth: [] }],
    paths: {
      "/api/v1/check-csv": {
        post: {
          operationId: "checkCsv",
          summary: "Validate CSV data",
          description: "Validates and analyzes CSV data. Requires a valid API key.",
          security: [{ apiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CheckCsvRequest" }
              }
            }
          },
          responses: {
            "200": {
              description: "Successful operation",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CheckCsvResponse" }
                }
              }
            },
            "400": {
              description: "Invalid input",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" }
                }
              }
            },
            "500": {
              description: "Server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" }
                }
              }
            }
          }
        }
      }
    }
  },
  'summarize': {
    openapi: "3.1.0",
    info: {
      title: "Summarize API",
      description: "API for summarizing text. Requires an API key to be passed in the x-api-key header.",
      version: summarizeTool.version
    },
    servers: [
      {
        url: "https://1c65-2603-9000-f300-1662-2e6e-f657-9710-a10.ngrok-free.app",
        description: "Production server"
      }
    ],
    components: {
      schemas: {
        SummarizeRequest: zodToJsonSchema(summarizeTool.inputSchema),
        SummarizeResponse: zodToJsonSchema(summarizeTool.outputSchema),
        ErrorResponse: zodToJsonSchema(ErrorResponseSchema)
      },
      securitySchemes: {
        apiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
          description: "API key for authentication. Required for all requests. The API key must be passed in the x-api-key header.",
          "x-connector-config": {
            "required": true,
            "type": "string",
            "description": "The API key required for authentication"
          }
        },
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          description: "API key for authentication. Required for all requests. The API key must be passed as a Bearer token in the Authorization header.",
          "x-connector-config": {
            "required": true,
            "type": "string",
            "description": "The API key required for authentication"
          }
        }
      }
    },
    security: [{ apiKeyAuth: [] }, { bearerAuth: [] }],
    paths: {
      "/api/v1/summarize": {
        post: {
          operationId: "summarize",
          summary: "Summarize text",
          description: "Summarizes the provided text. Requires a valid API key in either the x-api-key header or as a Bearer token in the Authorization header.",
          security: [{ apiKeyAuth: [] }, { bearerAuth: [] }],
          "x-connector-config": {
            "requiresAuth": true,
            "authType": ["apiKey", "bearer"],
            "authHeader": ["x-api-key", "Authorization"]
          },
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SummarizeRequest" }
              }
            }
          },
          responses: {
            "200": {
              description: "Successful operation",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SummarizeResponse" }
                }
              }
            },
            "400": {
              description: "Invalid input",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" }
                }
              }
            },
            "401": {
              description: "Unauthorized - API key is required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" }
                }
              }
            },
            "429": {
              description: "Too many requests - Rate limit exceeded",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" }
                }
              }
            },
            "500": {
              description: "Server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" }
                }
              }
            }
          }
        }
      }
    }
  }
} as const;

// Generate static params for valid tools
export async function generateStaticParams() {
  return Object.keys(preImportedModules).map(tool => ({ tool }));
}

export async function GET(
  request: NextRequest,
  { params }: { params: { tool: string } }
) {
  try {
    const { tool } = params;
    console.log('Accessing tool:', tool);
    console.log('Available tools:', Object.keys(preImportedModules));
    console.log('Available schemas:', Object.keys(openapiSchemas));

    // Check if the tool exists
    if (!preImportedModules[tool as keyof typeof preImportedModules]) {
      console.log('Tool not found:', tool);
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }

    // Get the OpenAPI schema for the tool
    const schema = openapiSchemas[tool as keyof typeof openapiSchemas];
    if (!schema) {
      console.log('OpenAPI schema not found for tool:', tool);
      return NextResponse.json(
        { error: 'OpenAPI schema not found' },
        { status: 404 }
      );
    }

    console.log('Returning OpenAPI schema for tool:', tool);
    return NextResponse.json(schema);
  } catch (error) {
    console.error('Error in meta route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 