'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useRouter } from 'next/navigation';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Sign up with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create user record in our database
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email: authData.user.email,
              subscription_plan: 'free',
              role: 'user',
            },
          ])
          .select()
          .single();

        if (userError) throw userError;

        // Generate API key
        const apiKey = crypto.randomUUID();
        
        // Store API key in Supabase
        const { error: apiKeyError } = await supabase
          .from('api_keys')
          .insert([
            {
              user_id: authData.user.id,
              key: apiKey,
              is_active: true,
              rate_limit_per_minute: 100,
              burst_limit: 10,
              window_seconds: 60,
            },
          ]);

        if (apiKeyError) throw apiKeyError;

        // Show API key to user
        setApiKey(apiKey);
        
        // Store API key in localStorage
        localStorage.setItem('apiKey', apiKey);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          {apiKey && (
            <div className="bg-green-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-green-800">Your API Key:</h3>
              <div className="mt-2 text-sm text-green-700">
                <code className="bg-green-100 p-2 rounded">{apiKey}</code>
              </div>
              <p className="mt-2 text-sm text-green-600">
                Please save this key. You won't be able to see it again!
              </p>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 