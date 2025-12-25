import React, { useMemo } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, AlertCircle, CheckCircle, Info } from 'lucide-react';

const MAGNITUDE_BUCKETS = [
  { key: 'critical', label: '4+', min: 4, max: Infinity, color: '#FF3B30', bgColor: 'bg-red-500', description: 'Very significant findings' },
  { key: 'high', label: '3-4', min: 3, max: 4, color: '#FF9500', bgColor: 'bg-orange-500', description: 'Important findings' },
  { key: 'moderate', label: '2-3', min: 2, max: 3, color: '#FFCC00', bgColor: 'bg-yellow-500', description: 'Notable findings' },
  { key: 'low', label: '1-2', min: 1, max: 2, color: '#34C759', bgColor: 'bg-green-500', description: 'Minor findings' },
  { key: 'benign', label: '0-1', min: 0, max: 1, color: '#8E8E93', bgColor: 'bg-gray-500', description: 'Common variants' }
];

export function MagnitudeChart({ matches, onBucketClick }) {
  const distribution = useMemo(() => {
    const counts = {};
    let total = 0;

    MAGNITUDE_BUCKETS.forEach(bucket => {
      counts[bucket.key] = {
        ...bucket,
        count: 0,
        matches: []
      };
    });

    matches.forEach(match => {
      const mag = match.magnitude || 0;
      for (const bucket of MAGNITUDE_BUCKETS) {
        if (mag >= bucket.min && mag < bucket.max) {
          counts[bucket.key].count++;
          counts[bucket.key].matches.push(match);
          total++;
          break;
        }
      }
    });

    // Calculate percentages
    Object.values(counts).forEach(bucket => {
      bucket.percent = total > 0 ? (bucket.count / total) * 100 : 0;
    });

    return { buckets: counts, total };
  }, [matches]);

  const maxCount = Math.max(...Object.values(distribution.buckets).map(b => b.count));

  return (
    <div className={clsx(
      'p-6 rounded-2xl',
      'bg-gray-50 dark:bg-white/5 backdrop-blur-sm',
      'border border-gray-200 dark:border-white/10'
    )}>
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-purple-500" />
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Finding Significance
        </h3>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard
          icon={<AlertCircle className="w-4 h-4" />}
          label="High Impact"
          value={distribution.buckets.critical.count + distribution.buckets.high.count}
          color="text-red-400"
          bgColor="bg-red-500/10"
        />
        <StatCard
          icon={<Info className="w-4 h-4" />}
          label="Notable"
          value={distribution.buckets.moderate.count}
          color="text-amber-400"
          bgColor="bg-amber-500/10"
        />
        <StatCard
          icon={<CheckCircle className="w-4 h-4" />}
          label="Common"
          value={distribution.buckets.low.count + distribution.buckets.benign.count}
          color="text-emerald-400"
          bgColor="bg-emerald-500/10"
        />
      </div>

      {/* Horizontal Bar Chart */}
      <div className="space-y-3">
        {MAGNITUDE_BUCKETS.map((bucket, index) => {
          const data = distribution.buckets[bucket.key];
          const barWidth = maxCount > 0 ? (data.count / maxCount) * 100 : 0;

          return (
            <motion.button
              key={bucket.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onBucketClick?.(data.matches)}
              className={clsx(
                'w-full group',
                'hover:bg-gray-100 dark:hover:bg-white/5',
                'rounded-lg p-2 -m-2 transition-colors'
              )}
            >
              <div className="flex items-center gap-3">
                {/* Label */}
                <div className="w-12 text-right">
                  <span className="text-sm font-mono text-[var(--text-secondary)]">
                    {bucket.label}
                  </span>
                </div>

                {/* Bar Container */}
                <div className="flex-1 h-8 bg-gray-200 dark:bg-white/10 rounded-lg overflow-hidden relative">
                  {/* Bar */}
                  <motion.div
                    className="h-full rounded-lg flex items-center"
                    style={{ backgroundColor: bucket.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
                  >
                    {barWidth > 15 && (
                      <span className="text-xs font-medium text-white px-2">
                        {data.count}
                      </span>
                    )}
                  </motion.div>

                  {/* Count outside bar if bar is too small */}
                  {barWidth <= 15 && data.count > 0 && (
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-medium text-[var(--text-secondary)]">
                      {data.count}
                    </span>
                  )}
                </div>

                {/* Percentage */}
                <div className="w-14 text-right">
                  <span className="text-sm text-[var(--text-secondary)]">
                    {data.percent.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Description on hover */}
              <div className="ml-15 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-[var(--text-secondary)]">
                  {bucket.description}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Stacked bar overview */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-white/10">
        <div className="text-xs text-[var(--text-secondary)] mb-2">Distribution Overview</div>
        <div className="h-4 rounded-full overflow-hidden flex bg-gray-200 dark:bg-white/10">
          {MAGNITUDE_BUCKETS.map((bucket, index) => {
            const data = distribution.buckets[bucket.key];
            if (data.percent === 0) return null;
            return (
              <motion.div
                key={bucket.key}
                style={{ backgroundColor: bucket.color }}
                initial={{ width: 0 }}
                animate={{ width: `${data.percent}%` }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="h-full"
                title={`${bucket.label}: ${data.count} (${data.percent.toFixed(1)}%)`}
              />
            );
          })}
        </div>
      </div>

      {/* Total */}
      <div className="mt-4 text-center">
        <span className="text-2xl font-bold text-[var(--text-primary)]">
          {distribution.total.toLocaleString()}
        </span>
        <span className="text-sm text-[var(--text-secondary)] ml-2">
          total findings
        </span>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, bgColor }) {
  return (
    <div className={clsx(
      'p-3 rounded-xl text-center',
      bgColor,
      'border border-gray-200 dark:border-white/5'
    )}>
      <div className={clsx('flex items-center justify-center gap-1 mb-1', color)}>
        {icon}
      </div>
      <div className={clsx('text-xl font-bold', color)}>
        {value}
      </div>
      <div className="text-xs text-[var(--text-secondary)]">
        {label}
      </div>
    </div>
  );
}

export default MagnitudeChart;
