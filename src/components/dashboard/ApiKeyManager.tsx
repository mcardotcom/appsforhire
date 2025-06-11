'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
  last_used: string | null;
  is_active: boolean;
}

export function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newKey = generateApiKey();
      const { error } = await supabase.from('api_keys').insert([
        {
          user_id: user.id,
          name: newKeyName,
          key: newKey,
          is_active: true,
        },
      ]);

      if (error) throw error;
      setNewKeyName('');
      fetchApiKeys();
    } catch (error) {
      console.error('Error creating API key:', error);
    }
  };

  const toggleApiKey = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchApiKeys();
    } catch (error) {
      console.error('Error toggling API key:', error);
    }
  };

  const deleteApiKey = async (id: string) => {
    try {
      const { error } = await supabase.from('api_keys').delete().eq('id', id);
      if (error) throw error;
      fetchApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const keyLength = 32;
    let key = '';
    for (let i = 0; i < keyLength; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  };

  return (
    <div className="bg-surface shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-textPrimary">API Keys</h3>
        <div className="mt-2 max-w-xl text-sm text-textMuted">
          <p>Manage your API keys for accessing the AppsForHire API.</p>
        </div>
        <form onSubmit={createApiKey} className="mt-5 sm:flex sm:items-center">
          <div className="w-full sm:max-w-xs">
            <label htmlFor="key-name" className="sr-only">
              Key name
            </label>
            <input
              type="text"
              name="key-name"
              id="key-name"
              className="block w-full rounded-md border-textMuted/20 shadow-sm focus:border-accent focus:ring-accent sm:text-sm"
              placeholder="Enter key name"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-accent px-4 py-2 font-medium text-white shadow-sm hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Create new key
          </button>
        </form>
      </div>
      <div className="border-t border-textMuted/20">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-textMuted/20">
            <thead className="bg-background">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider"
                >
                  Key
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider"
                >
                  Created
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider"
                >
                  Last Used
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider"
                >
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-textMuted/20">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-textMuted">
                    Loading...
                  </td>
                </tr>
              ) : apiKeys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-textMuted">
                    No API keys found
                  </td>
                </tr>
              ) : (
                apiKeys.map((key) => (
                  <tr key={key.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-textPrimary">
                      {key.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textMuted">
                      {key.key}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textMuted">
                      {new Date(key.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textMuted">
                      {key.last_used
                        ? new Date(key.last_used).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          key.is_active
                            ? 'bg-success/10 text-success'
                            : 'bg-error/10 text-error'
                        }`}
                      >
                        {key.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => toggleApiKey(key.id, key.is_active)}
                        className="text-accent hover:text-accent/80 mr-4"
                      >
                        {key.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => deleteApiKey(key.id)}
                        className="text-error hover:text-error/80"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 