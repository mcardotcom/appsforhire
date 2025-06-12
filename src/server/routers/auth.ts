import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { prisma } from '../prisma';
import { logger } from '../../utils/logger';

export const authRouter = router({
  signup: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Create user
        const user = await prisma.user.create({
          data: {
            email: input.email,
            subscription_plan: 'free',
            role: 'user',
          },
        });

        // Generate API key
        const apiKey = await prisma.apiKey.create({
          data: {
            user_id: user.id,
            key: crypto.randomUUID(),
            rate_limit_per_minute: 100,
            burst_limit: 10,
            window_seconds: 60,
          },
        });

        logger.info('User signed up successfully', { userId: user.id });
        return { apiKey: apiKey.key };
      } catch (error) {
        logger.error('Signup error:', error);
        throw error;
      }
    }),
}); 