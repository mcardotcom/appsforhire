'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import { trpc } from './trpc';
import { clientCookies } from './client-cookies';

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  }));

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          headers() {
            const apiKey = clientCookies.getApiKey();
            return {
              'Content-Type': 'application/json',
              ...(apiKey ? { 'x-api-key': apiKey } : {}),
            };
          },
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: 'include',
            }).then(async (response) => {
              if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After');
                const seconds = retryAfter ? parseInt(retryAfter, 10) : 60;
                throw new Error(`Rate limit exceeded. Please try again after ${seconds} seconds.`);
              }
              return response;
            });
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
} 