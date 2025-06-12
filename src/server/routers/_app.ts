import { router } from '../trpc';
import { toolsRouter } from './tools';

export const appRouter = router({
  tools: toolsRouter,
});

export type AppRouter = typeof appRouter; 