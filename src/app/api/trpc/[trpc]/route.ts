import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/routers/_app';
import { createContext } from '@/server/trpc';
import { NextRequest } from 'next/server';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => {
      // Create a new NextRequest with the original request's headers
      const nextReq = new NextRequest(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body,
      });
      return createContext({ req: nextReq });
    },
  });

export { handler as GET, handler as POST }; 