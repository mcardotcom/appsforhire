import { summarizeTool } from '@/tools/summarize';
import { ErrorResponseSchema } from '@/schemas/summarizeSchema';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Generate OpenAPI schema
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

// Export OpenAPI schema
export const openapi = {
  openapi: '3.1.0',
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
    '/api/v1/summarize': {
      post: {
        operationId: 'summarize',
        summary: 'Summarize text',
        description: 'Summarizes the provided text. Requires a valid API key in the x-api-key header.',
        security: [
          {
            apiKeyAuth: []
          }
        ],
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
}; 