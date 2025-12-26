import React, { useState } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { AlertTriangle, ThumbsUp, ThumbsDown, Minus, ExternalLink } from 'lucide-react';
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
  const [showPositive, setShowPositive] = useState(false);

  // Filter matches by repute and sort by magnitude
  const filteredFindings = [...matches]
    .filter(m => {
      const repute = m.repute?.toLowerCase();
      const hasMagnitude = (m.magnitude || 0) >= 0.5;
      if (showPositive) {
        return repute === 'good' && hasMagnitude;
      } else {
        return repute === 'bad' && hasMagnitude;
      }
    })
    .sort((a, b) => (b.magnitude || 0) - (a.magnitude || 0))
    .slice(0, maxItems);

  const getReputeIcon = (repute, magnitude) => {
    if (magnitude === 0 || magnitude < 0.5) {
      return <Minus className="w-4 h-4 text-gray-400" />;
    }

    const r = repute?.toLowerCase();
    switch (r) {
      case 'bad':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'good':
        return <ThumbsUp className="w-4 h-4 text-teal-500" />;
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
      {/* Header with Toggle */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Top Findings
        </h3>

        {/* Toggle Switch */}
        <div className="flex items-center gap-1 p-1 bg-gray-200 dark:bg-white/10 rounded-full">
          <button
            onClick={() => setShowPositive(false)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
              !showPositive
                ? 'bg-white dark:bg-stone-700 text-red-600 dark:text-red-400 shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
            )}
          >
            <ThumbsDown className="w-4 h-4" />
            <span className="hidden sm:inline">Risks</span>
          </button>
          <button
            onClick={() => setShowPositive(true)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
              showPositive
                ? 'bg-white dark:bg-stone-700 text-teal-600 dark:text-teal-400 shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
            )}
          >
            <ThumbsUp className="w-4 h-4" />
            <span className="hidden sm:inline">Benefits</span>
          </button>
        </div>
      </div>

      {filteredFindings.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-[var(--text-secondary)]">
            No {showPositive ? 'beneficial' : 'risk'} findings to display
          </p>
        </div>
      ) : (
        <motion.div
          key={showPositive ? 'positive' : 'negative'}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {filteredFindings.map((match, index) => (
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
                'focus-visible:ring-stone-500 dark:focus-visible:ring-stone-400',
                'group'
              )}
            >
              <div className="flex items-start gap-3">
                {/* Repute Icon */}
                <div className={clsx(
                  'mt-0.5 p-1.5 rounded-lg',
                  match.repute?.toLowerCase() === 'bad' && 'bg-red-500/10',
                  match.repute?.toLowerCase() === 'good' && 'bg-teal-500/10'
                )}>
                  {getReputeIcon(match.repute, match.magnitude)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-mono text-stone-600 dark:text-stone-400">
                      {match.rsid}
                    </code>
                    <MagnitudeBadge magnitude={match.magnitude} repute={match.repute} size="xs" />
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
      )}
    </div>
  );
}

export default QuickInsights;
