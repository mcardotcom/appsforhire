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

// Export OpenAPI schema
export const openapi = {
  openapi: "3.1.0",
  info: {
    title: "Clean JSON API",
    description: "API for cleaning and normalizing JSON data",
    version: cleanJsonTool.version
  },
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
          }
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
        description: "Cleans and normalizes JSON data. Requires a valid API key.",
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
            description: "Successful operation",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CleanJsonResponse"
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