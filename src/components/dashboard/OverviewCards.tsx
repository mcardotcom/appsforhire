import { StatCard } from './StatCard';

interface OverviewCardsProps {
  stats: {
    totalCalls: number;
    callsChange: number;
    totalTokens: number;
    tokensChange: number;
    successRate: number;
    successChange: number;
    averageLatency: number;
    latencyChange: number;
  };
  isLoading: boolean;
}

export function OverviewCards({ stats, isLoading }: OverviewCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total API Calls"
        value={stats.totalCalls.toLocaleString()}
        change={stats.callsChange}
        loading={isLoading}
      />
      <StatCard
        title="Total Tokens Used"
        value={stats.totalTokens.toLocaleString()}
        change={stats.tokensChange}
        loading={isLoading}
      />
      <StatCard
        title="Success Rate"
        value={`${stats.successRate.toFixed(1)}%`}
        change={stats.successChange}
        loading={isLoading}
      />
      <StatCard
        title="Average Latency"
        value={`${stats.averageLatency}ms`}
        change={stats.latencyChange}
        loading={isLoading}
      />
    </div>
  );
} 