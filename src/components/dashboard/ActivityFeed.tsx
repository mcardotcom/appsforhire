'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';

interface Activity {
  id: string;
  endpoint: string;
  method: string;
  status: number;
  response_time: number;
  tokens_used: number;
  created_at: string;
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const itemsPerPage = 10;

  useEffect(() => {
    fetchActivities();
  }, [page, search]);

  const fetchActivities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('api_usage')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.ilike('endpoint', `%${search}%`);
      }

      const { data, error } = await query
        .range((page - 1) * itemsPerPage, page * itemsPerPage - 1);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-success/10 text-success';
    if (status >= 400 && status < 500) return 'bg-warning/10 text-warning';
    if (status >= 500) return 'bg-error/10 text-error';
    return 'bg-textMuted/10 text-textMuted';
  };

  return (
    <div className="bg-surface shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-textPrimary">Activity Feed</h3>
        <div className="mt-2 max-w-xl text-sm text-textMuted">
          <p>Monitor your API usage and track performance metrics.</p>
        </div>
        <div className="mt-4">
          <input
            type="text"
            placeholder="Search endpoints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-md border-textMuted/20 shadow-sm focus:border-accent focus:ring-accent sm:text-sm"
          />
        </div>
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
                  Endpoint
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider"
                >
                  Method
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider"
                >
                  Response Time
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider"
                >
                  Tokens Used
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-textMuted uppercase tracking-wider"
                >
                  Timestamp
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
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-textMuted">
                    No activity found
                  </td>
                </tr>
              ) : (
                activities.map((activity) => (
                  <tr key={activity.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-textPrimary">
                      {activity.endpoint}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textMuted">
                      {activity.method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          activity.status
                        )}`}
                      >
                        {activity.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textMuted">
                      {activity.response_time}ms
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textMuted">
                      {activity.tokens_used}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textMuted">
                      {new Date(activity.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-background px-4 py-3 flex items-center justify-between border-t border-textMuted/20 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-textMuted/20 text-sm font-medium rounded-md text-textMuted bg-surface hover:bg-background"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={activities.length < itemsPerPage}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-textMuted/20 text-sm font-medium rounded-md text-textMuted bg-surface hover:bg-background"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-textMuted">
                Showing page <span className="font-medium">{page}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-textMuted/20 bg-surface text-sm font-medium text-textMuted hover:bg-background"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={activities.length < itemsPerPage}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-textMuted/20 bg-surface text-sm font-medium text-textMuted hover:bg-background"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 