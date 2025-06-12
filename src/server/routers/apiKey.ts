import { z } from 'zod';
import { router, apiKeyProcedure } from '../trpc';
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export const apiKeyRouter = router({
  list: apiKeyProcedure.query(async ({ ctx }) => {
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        user_id: ctx.apiKey.user_id,
      },
      select: {
        id: true,
        key: true,
        created_at: true,
        expires_at: true,
        is_active: true,
        rate_limit_per_minute: true,
        last_request_at: true,
        burst_limit: true,
        window_seconds: true,
      },
    });
    return apiKeys;
  }),

  create: apiKeyProcedure
    .input(
      z.object({
        rate_limit_per_minute: z.number().min(1).max(1000).optional(),
        expires_at: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const apiKey = await prisma.apiKey.create({
        data: {
          user_id: ctx.apiKey.user_id,
          key: crypto.randomUUID(),
          rate_limit_per_minute: input.rate_limit_per_minute ?? 100,
          expires_at: input.expires_at,
          burst_limit: 10,
          window_seconds: 60,
        },
      });
      return apiKey;
    }),

  toggle: apiKeyProcedure
    .input(
      z.object({
        id: z.string(),
        is_active: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const apiKey = await prisma.apiKey.update({
        where: {
          id: input.id,
          user_id: ctx.apiKey.user_id,
        },
        data: {
          is_active: input.is_active,
        },
      });
      return apiKey;
    }),

  delete: apiKeyProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await prisma.apiKey.delete({
        where: {
          id: input.id,
          user_id: ctx.apiKey.user_id,
        },
      });
      return { success: true };
    }),
}); 