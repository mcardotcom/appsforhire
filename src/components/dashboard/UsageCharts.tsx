'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface UsageData {
  date: string;
  calls: number;
  tokens: number;
}

interface EndpointData {
  name: string;
  value: number;
}

export function UsageCharts() {
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [endpointData, setEndpointData] = useState<EndpointData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch usage data for the last 7 days
      const { data: usage, error: usageError } = await supabase
        .from('api_usage')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('date', { ascending: true });

      if (usageError) throw usageError;

      // Fetch endpoint distribution data
      const { data: endpoints, error: endpointError } = await supabase
        .from('api_endpoints')
        .select('*')
        .eq('user_id', user.id)
        .order('calls', { ascending: false })
        .limit(5);

      if (endpointError) throw endpointError;

      setUsageData(usage || []);
      setEndpointData(
        (endpoints || []).map((endpoint) => ({
          name: endpoint.name,
          value: endpoint.calls,
        }))
      );
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const COLORS = ['#F43F5E', '#10B981', '#6366F1', '#F59E0B', '#EF4444'];

  if (isLoading) {
    return (
      <div className="bg-surface shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-textMuted/10 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-textMuted/10 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="bg-surface shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-textPrimary mb-4">API Usage Over Time</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={usageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.375rem',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="calls" stroke="#F43F5E" name="API Calls" />
              <Line type="monotone" dataKey="tokens" stroke="#10B981" name="Tokens Used" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-surface shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-textPrimary mb-4">Endpoint Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={endpointData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {endpointData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.375rem',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 