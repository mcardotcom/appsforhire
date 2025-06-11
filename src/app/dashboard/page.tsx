'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { OverviewCards } from '@/components/dashboard/OverviewCards';
import { UsageCharts } from '@/components/dashboard/UsageCharts';
import { ApiKeyManager } from '@/components/dashboard/ApiKeyManager';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCalls: 0,
    callsChange: 0,
    totalTokens: 0,
    tokensChange: 0,
    successRate: 0,
    successChange: 0,
    averageLatency: 0,
    latencyChange: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: statsData, error } = await supabase
          .from('api_usage_stats')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        setStats({
          totalCalls: statsData.total_calls || 0,
          callsChange: statsData.calls_change || 0,
          totalTokens: statsData.total_tokens || 0,
          tokensChange: statsData.tokens_change || 0,
          successRate: statsData.success_rate || 0,
          successChange: statsData.success_change || 0,
          averageLatency: statsData.average_latency || 0,
          latencyChange: statsData.latency_change || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Dashboard
          </h2>
        </div>
      </div>

      <OverviewCards stats={stats} isLoading={isLoading} />
      <UsageCharts />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ApiKeyManager />
        <ActivityFeed />
      </div>
    </div>
  );
} 