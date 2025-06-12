import { checkCsvTool } from '@/tools/check-csv';
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

// Export OpenAPI schema
export const openapi = {
  openapi: "3.1.0",
  info: {
    title: "Check CSV API",
    description: "API for validating and analyzing CSV data",
    version: checkCsvTool.version
  },
  components: {
    schemas: {
      CheckCsvRequest: inputSchema,
      CheckCsvResponse: outputSchema,
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
              processingTime: {
                type: "number"
              },
              validationRules: {
                type: "array",
                items: {
                  type: "string"
                }
              },
              sampleData: {
                type: "array",
                items: {
                  type: "object"
                }
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
  security: [
    {
      apiKeyAuth: []
    }
  ],
  paths: {
    "/api/v1/check-csv": {
      post: {
        operationId: "checkCsv",
        summary: "Validate CSV data",
        description: "Validates and analyzes CSV data. Requires a valid API key.",
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
            description: "Successful operation",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CheckCsvResponse"
                }
              }
            }
          },
          "400": {
            description: "Invalid input",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "500": {
            description: "Server error",
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