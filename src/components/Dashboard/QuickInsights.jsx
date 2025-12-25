import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { AlertTriangle, ThumbsUp, Minus, ExternalLink } from 'lucide-react';
import { MagnitudeBadge } from '../common/Badge';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

export function QuickInsights({ matches = [], maxItems = 5, onSelectSNP }) {
  // Get top findings sorted by magnitude
  const topFindings = [...matches]
    .sort((a, b) => (b.magnitude || 0) - (a.magnitude || 0))
    .slice(0, maxItems);

  if (topFindings.length === 0) {
    return (
      <div className={clsx(
        'p-8 rounded-2xl text-center',
        'bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10'
      )}>
        <p className="text-[var(--text-secondary)]">
          No notable findings to display
        </p>
      </div>
    );
  }

  const getReputeIcon = (repute) => {
    switch (repute) {
      case 'bad':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'good':
        return <ThumbsUp className="w-4 h-4 text-emerald-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className={clsx(
      'p-6 rounded-2xl',
      'bg-gray-50 dark:bg-white/5 backdrop-blur-sm',
      'border border-gray-200 dark:border-white/10'
    )}>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
        Top Findings
      </h3>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {topFindings.map((match, index) => (
          <motion.button
            key={match.rsid || index}
            variants={itemVariants}
            onClick={() => onSelectSNP?.(match)}
            className={clsx(
              'w-full p-4 rounded-xl',
              'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10',
              'text-left',
              'transition-all duration-200',
              'hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-400',
              'group'
            )}
          >
            <div className="flex items-start gap-3">
              {/* Repute Icon */}
              <div className={clsx(
                'mt-0.5 p-1.5 rounded-lg',
                match.repute === 'bad' && 'bg-red-500/10',
                match.repute === 'good' && 'bg-emerald-500/10',
                match.repute === 'neutral' && 'bg-gray-500/10'
              )}>
                {getReputeIcon(match.repute)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-sm font-mono text-cyan-400">
                    {match.rsid}
                  </code>
                  <MagnitudeBadge magnitude={match.magnitude} size="xs" />
                  {match.userGenotype && (
                    <span className="text-xs text-[var(--text-secondary)] font-mono">
                      {match.userGenotype}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                  {match.summary || 'No summary available'}
                </p>
              </div>

              {/* Arrow */}
              <ExternalLink className={clsx(
                'w-4 h-4 text-[var(--text-secondary)]',
                'opacity-0 group-hover:opacity-100',
                'transition-opacity duration-200'
              )} />
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}

export default QuickInsights;
