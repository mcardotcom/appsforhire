import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/index';
import { createContext } from '@/server/trpc';
import { NextRequest } from 'next/server';

const handler = async (req: NextRequest) => {
  try {
    console.log('🚀 tRPC API route called:', {
      url: req.url,
      method: req.method,
      pathname: new URL(req.url).pathname,
    });

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Check if this is a mutation request
    const path = new URL(req.url).pathname.split('/').pop();
    const isMutation = path?.includes('.') && !path?.startsWith('query.');
    
    // Only allow POST for mutations
    if (isMutation && req.method !== 'POST') {
      return new Response(
        JSON.stringify({
          error: {
            message: `Unsupported ${req.method}-request to mutation procedure at path "${path}"`,
            code: 'METHOD_NOT_SUPPORTED',
          },
        }),
        {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            'Allow': 'POST',
          },
        }
      );
    }

    // Use fetchRequestHandler directly - it returns a proper Response
    const response = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req,
      router: appRouter,
      createContext: () => createContext({ req }),
      onError:
        process.env.NODE_ENV === 'development'
          ? ({ path, error }) => {
              console.error(
                `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`,
                {
                  error: error.message,
                  stack: error.stack,
                  cause: error.cause,
                }
              );
            }
          : undefined,
    });

    // Add CORS headers to the response
    const corsHeaders = new Headers(response.headers);
    corsHeaders.set('Access-Control-Allow-Origin', '*');
    corsHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    corsHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('❌ tRPC API route error:', error);
    
    // Return proper JSON error response
    return new Response(
      JSON.stringify({
        error: {
          message: error instanceof Error ? error.message : 'Internal Server Error',
          code: 'INTERNAL_SERVER_ERROR',
        },
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
};

// Only export POST handler for mutations
export { handler as POST }; 