import { initTRPC } from '@trpc/server';
import { PrismaClient } from '@/generated/prisma';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

// Context type definition
export type Context = {
  prisma: PrismaClient;
  session: Awaited<ReturnType<typeof getServerSession>> | null;
  req: NextRequest;
};

// Create context for each request
export const createContext = async (opts: { req: NextRequest }): Promise<Context> => {
  const session = await getServerSession();
  return {
    prisma,
    session,
    req: opts.req,
  };
};

// Initialize tRPC
const t = initTRPC.context<Context>().create();

// Export reusable router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

// Auth middleware
const isAuthed = middleware(({ next, ctx }) => {
  if (!ctx.session) {
    throw new Error('Not authenticated');
  }
  return next({
    ctx: {
      session: ctx.session,
    },
  });
});

// Protected procedure
export const protectedProcedure = t.procedure.use(isAuthed);

// API Key middleware
const apiKeyMiddleware = middleware(async ({ ctx, next }) => {
  // Try to get API key from headers (for both Node and Edge runtimes)
  const apiKey = ctx.req.headers.get('x-api-key') || '';

  if (!apiKey) {
    throw new Error('Missing API key');
  }

  // Validate API key in the database
  const apiKeyRecord = await ctx.prisma.apiKey.findFirst({
    where: { key: apiKey, is_active: true },
    include: { user: true },
  });

  if (!apiKeyRecord) {
    throw new Error('Invalid or inactive API key');
  }

  // Rate limiting logic
  const now = new Date();
  const windowStart = new Date(now.getTime() - apiKeyRecord.window_seconds * 1000);
  const recentLogs = await ctx.prisma.toolLog.count({
    where: {
      api_key_id: apiKeyRecord.id,
      created_at: { gte: windowStart },
    },
  });

  if (recentLogs >= apiKeyRecord.rate_limit_per_minute) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  // Optionally, update last_request_at
  await ctx.prisma.apiKey.update({
    where: { id: apiKeyRecord.id },
    data: { last_request_at: now },
  });

  // Attach user and apiKey info to context
  return next({
    ctx: {
      ...ctx,
      apiKey: apiKeyRecord,
      user: apiKeyRecord.user,
    },
  });
});

export const apiKeyProcedure = t.procedure.use(apiKeyMiddleware); 