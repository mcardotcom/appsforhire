import { initTRPC, TRPCError } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { PrismaClient } from '../generated/prisma';
import { getApiKeyFromRequest } from '../utils/auth';

const prisma = new PrismaClient();

// Context type definition
export type Context = {
  prisma: PrismaClient;
  req: CreateNextContextOptions['req'];
  apiKey?: {
    id: string;
    user_id: string;
    rate_limit_per_minute: number;
    burst_limit: number;
    window_seconds: number;
  };
};

// Create context for each request
export const createContext = async (opts: { req: CreateNextContextOptions['req'] }): Promise<Context> => {
  return {
    prisma,
    req: opts.req,
  };
};

// Initialize tRPC
const t = initTRPC.context<Context>().create();

// Export reusable router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

// API Key middleware
const apiKeyMiddleware = middleware(async ({ ctx, next }) => {
  const apiKey = await getApiKeyFromRequest(ctx.req);
  if (!apiKey) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'API key is required',
    });
  }
  return next({
    ctx: {
      ...ctx,
      apiKey,
    },
  });
});

export const apiKeyProcedure = t.procedure.use(apiKeyMiddleware); 