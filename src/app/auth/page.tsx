'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/utils/trpc';
import { clientCookies } from '@/utils/client-cookies';
import { logger } from '@/utils/logger';
import { TRPCClientError } from '@trpc/client';
import type { AppRouter } from '@/server/routers/_app';

// Placeholder logo SVG (replace with your own if needed)
const Logo = () => (
  <div className="flex justify-center mb-6">
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="12" fill="#F43F5E"/>
      <circle cx="24" cy="24" r="12" fill="#101827"/>
    </svg>
  </div>
);

type SignupResponse = {
  apiKey?: string;
  user?: any;
  error?: {
    message: string;
    code: string;
  };
};

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const router = useRouter();

  // Countdown timer effect
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const signupMutation = trpc.auth.signup.useMutation({
    retry: false, // Disable automatic retries
    onSuccess: (data) => {
      if (data.apiKey) {
        clientCookies.setApiKey(data.apiKey);
        router.push('/dashboard');
      }
      // Always wait at least a minute after successful signup
      setCooldown(60);
    },
    onError: (err: unknown) => {
      // Get a human-readable string
      let userMsg: string;
      if (err instanceof TRPCClientError) {
        // err.shape.message is the original server text, unquoted
        userMsg = err.shape?.message ?? 'An unknown error occurred';
      } else if (err instanceof Error) {
        userMsg = err.message;
      } else {
        userMsg = String(err);
      }

      // Log it cleanly
      console.error('Signup failed:', userMsg);

      // Only log server details if there are any
      if (
        err instanceof TRPCClientError &&
        err.shape?.data &&
        Object.keys(err.shape.data).length > 0
      ) {
        console.error('Server error details:', err.shape.data);
      }

      // Handle specific error cases
      if (userMsg.includes('already been registered')) {
        setError('This email is already registered. Would you like to sign in instead?');
        // Automatically switch to login mode after a short delay
        setTimeout(() => {
          setIsLogin(true);
        }, 2000);
      } else if (
        err instanceof TRPCClientError &&
        err.shape?.data?.code === 'TOO_MANY_REQUESTS'
      ) {
        const match = userMsg.match(/after (\d+) seconds/);
        if (match) {
          const seconds = parseInt(match[1], 10);
          console.log(`Throttled. Starting cooldown: ${seconds}s`);
          setCooldown(seconds);
          setError(`Please wait ${seconds} seconds before trying again`);
        }
      } else if (userMsg.includes('Missing required Supabase environment variables')) {
        setError('Server configuration error. Please contact support.');
      } else if (err instanceof TRPCClientError && err.shape?.data?.code === 'BAD_REQUEST') {
        setError(userMsg);
      } else if (err instanceof TRPCClientError && err.shape?.data?.code === 'INTERNAL_SERVER_ERROR') {
        setError('An unexpected error occurred. Please try again later.');
      } else {
        setError(userMsg || 'An unexpected error occurred during signup');
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission
    setError('');
    
    // Don't allow submission during cooldown
    if (cooldown > 0) {
      setError(`Please wait ${cooldown} seconds before trying again`);
      return;
    }

    // Don't allow submission if already submitting
    if (signupMutation.isPending) {
      return;
    }

    if (isLogin) {
      // TODO: Implement login
      console.log('Login:', { email, password });
    } else {
      try {
        await signupMutation.mutateAsync({ email, password });
      } catch (error) {
        // Error handling is already done in the mutation's onError callback
        console.error('Signup mutation failed:', error);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full bg-surface rounded-2xl shadow p-8">
        <Logo />
        <h2 className="text-center text-2xl font-bold text-textPrimary mb-8">
          {isLogin ? 'Welcome back' : 'Sign up for an account'}
        </h2>
        <form 
          className="space-y-6" 
          onSubmit={handleSubmit}
          method="POST" // Explicitly set method to POST
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-textPrimary mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-md border border-primary px-3 py-2 placeholder-textMuted text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent bg-surface"
                placeholder="your@email.address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-textPrimary mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required
                className="block w-full rounded-md border border-primary px-3 py-2 placeholder-textMuted text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent bg-surface"
                placeholder="Your secret password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-error text-sm text-center">
              {error}
              {error.includes('already registered') && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className="text-accent hover:text-[#F97687] font-medium"
                  >
                    Switch to sign in
                  </button>
                  {' • '}
                  <a
                    href="/auth/reset"
                    className="text-accent hover:text-[#F97687] font-medium"
                  >
                    Forgot password?
                  </a>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={cooldown > 0 || signupMutation.isPending}
            className="w-full rounded-md bg-accent text-white font-semibold py-3 mt-2 shadow hover:bg-[#F97687] transition focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cooldown > 0 
              ? `Wait ${cooldown.toString().padStart(2, '0')}s` 
              : signupMutation.isPending 
                ? 'Creating account...' 
                : (isLogin ? 'Sign in' : 'Sign up')}
          </button>
        </form>
        <div className="mt-6">
          <div className="text-sm text-center text-textMuted">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-accent hover:text-[#F97687]"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
        <div className="mt-6">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 rounded-md border border-primary bg-surface py-3 text-textPrimary font-medium shadow-sm hover:bg-background transition"
            // onClick={handleGoogleSignIn} // Uncomment and implement if you have Google auth
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.7 33.1 29.8 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.4 0 4.7.7 6.6 2l6.4-6.4C33.2 5.5 28.8 4 24 4c-7.1 0-13.1 4.1-16.2 10.1z"/><path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 17.1 19.2 14 24 14c2.4 0 4.7.7 6.6 2l6.4-6.4C33.2 5.5 28.8 4 24 4c-7.1 0-13.1 4.1-16.2 10.1z"/><path fill="#FBBC05" d="M24 44c5.8 0 10.7-1.9 14.3-5.1l-6.6-5.4C29.8 36 24 36 24 36c-5.8 0-10.7-1.9-14.3-5.1l6.6-5.4C18.2 33.1 23.1 36 24 36z"/><path fill="#EA4335" d="M44.5 20H24v8.5h11.7C34.7 33.1 29.8 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.4 0 4.7.7 6.6 2l6.4-6.4C33.2 5.5 28.8 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.3-4z" opacity=".3"/></g></svg>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
} 