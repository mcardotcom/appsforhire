import { colors } from '@/styles/theme';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  loading?: boolean;
}

export function StatCard({ title, value, change, loading = false }: StatCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="bg-surface shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-1">
            <dt className="text-sm font-medium text-textMuted truncate">{title}</dt>
            {loading ? (
              <dd className="mt-1 h-8 w-24 bg-textMuted/10 animate-pulse rounded"></dd>
            ) : (
              <dd className="mt-1 text-3xl font-semibold text-textPrimary">{value}</dd>
            )}
          </div>
        </div>
      </div>
      {change !== undefined && !loading && (
        <div className="bg-background px-5 py-3">
          <div className="text-sm">
            <span
              className={`font-medium ${
                isPositive ? 'text-success' : isNegative ? 'text-error' : 'text-textMuted'
              }`}
            >
              {isPositive ? '↑' : isNegative ? '↓' : ''} {Math.abs(change)}%
            </span>
            <span className="text-textMuted ml-2">from last period</span>
          </div>
        </div>
      )}
    </div>
  );
} 