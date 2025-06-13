import { router } from './trpc';
import { authRouter } from './routers/auth';
// Add other routers as needed

// Add debug logging for router initialization
console.log('Initializing tRPC router...');
console.log('Router type:', typeof router);
console.log('Auth router type:', typeof authRouter);

// Create the root router
export const appRouter = router({
  auth: authRouter,
  // Add other routers here
});

// Add debug logging for router methods
console.log('Available router methods:', Object.keys(appRouter._def.procedures));

// Export the router type
export type AppRouter = typeof appRouter; 