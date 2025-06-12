import { router } from '../trpc';
import { apiKeyRouter } from './apiKey';
import { authRouter } from './auth';

export const appRouter = router({
  apiKey: apiKeyRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter; 