'use client';

import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { cookieUtils } from '@/utils/cookies';
import { logger } from '@/utils/logger';

export function ApiKeyManager() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: apiKeys, refetch } = trpc.apiKey.list.useQuery();
  const createMutation = trpc.apiKey.create.useMutation({
    onSuccess: async (newApiKey) => {
      await cookieUtils.setApiKey(newApiKey.key);
      await refetch();
      setIsCreating(false);
    },
    onError: (error) => {
      logger.error('Error creating API key:', error);
      setError(error.message);
      setIsCreating(false);
    },
  });

  const toggleMutation = trpc.apiKey.toggle.useMutation({
    onSuccess: () => refetch(),
    onError: (error) => {
      logger.error('Error toggling API key:', error);
      setError(error.message);
    },
  });

  const deleteMutation = trpc.apiKey.delete.useMutation({
    onSuccess: () => refetch(),
    onError: (error) => {
      logger.error('Error deleting API key:', error);
      setError(error.message);
    },
  });

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);
    createMutation.mutate();
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    setError(null);
    toggleMutation.mutate({ id, isActive });
  };

  const handleDelete = async (id: string) => {
    setError(null);
    deleteMutation.mutate({ id });
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          API Keys
        </h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>Manage your API keys for accessing the API.</p>
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5">
          <button
            type="button"
            onClick={handleCreate}
            disabled={isCreating}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create New API Key'}
          </button>
        </div>

        <div className="mt-6">
          <div className="flow-root">
            <ul role="list" className="-my-5 divide-y divide-gray-200">
              {apiKeys?.map((apiKey) => (
                <li key={apiKey.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {apiKey.key}
                      </p>
                      <p className="truncate text-sm text-gray-500">
                        Created {new Date(apiKey.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggle(apiKey.id, !apiKey.is_active)}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        {apiKey.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDelete(apiKey.id)}
                        className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 