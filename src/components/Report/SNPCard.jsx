import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { ExternalLink, AlertTriangle, ThumbsUp, Minus, Info } from 'lucide-react';
import { MagnitudeBadge, CategoryBadge } from '../common/Badge';

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 }
  }
};

export function SNPCard({ match, onClick, compact = false }) {
  const {
    rsid,
    userGenotype,
    magnitude = 0,
    repute,
    summary,
    category,
    chrom,
    pos
  } = match;

  const getReputeStyles = () => {
    switch (repute) {
      case 'bad':
        return {
          border: 'border-red-200 dark:border-red-500/30 hover:border-red-300 dark:hover:border-red-500/50',
          bg: 'bg-red-50 dark:bg-red-500/5',
          icon: AlertTriangle,
          iconColor: 'text-red-500 dark:text-red-400'
        };
      case 'good':
        return {
          border: 'border-emerald-200 dark:border-emerald-500/30 hover:border-emerald-300 dark:hover:border-emerald-500/50',
          bg: 'bg-emerald-50 dark:bg-emerald-500/5',
          icon: ThumbsUp,
          iconColor: 'text-emerald-500 dark:text-emerald-400'
        };
      default:
        return {
          border: 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20',
          bg: 'bg-gray-50 dark:bg-white/5',
          icon: Minus,
          iconColor: 'text-gray-500 dark:text-gray-400'
        };
    }
  };

  const styles = getReputeStyles();
  const Icon = styles.icon;

  const snpediaUrl = rsid ? `https://www.snpedia.com/index.php/${rsid}` : null;

  if (compact) {
    return (
      <motion.div
        variants={cardVariants}
        className={clsx(
          'p-3 rounded-xl',
          'border',
          styles.border,
          styles.bg,
          'transition-all duration-200',
          onClick && 'cursor-pointer hover:scale-[1.01]'
        )}
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          <MagnitudeBadge magnitude={magnitude} size="sm" />
          <code className="text-sm font-mono text-cyan-400">{rsid}</code>
          <span className="text-xs font-mono text-[var(--text-secondary)]">
            {userGenotype}
          </span>
          <span className="flex-1 text-sm text-[var(--text-secondary)] truncate">
            {summary}
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={cardVariants}
      className={clsx(
        'p-5 rounded-2xl',
        'border',
        styles.border,
        styles.bg,
        'transition-all duration-200',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          {/* Repute Icon */}
          <div className={clsx(
            'p-2 rounded-lg',
            repute === 'bad' && 'bg-red-500/10',
            repute === 'good' && 'bg-emerald-500/10',
            repute === 'neutral' && 'bg-gray-500/10'
          )}>
            <Icon className={clsx('w-5 h-5', styles.iconColor)} />
          </div>

          {/* RSID and Genotype */}
          <div>
            <div className="flex items-center gap-2">
              <code className="text-lg font-mono font-semibold text-[var(--text-primary)]">
                {rsid}
              </code>
              {snpediaUrl && (
                <a
                  href={snpediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={clsx(
                    'p-1 rounded',
                    'text-[var(--text-secondary)] hover:text-cyan-400',
                    'transition-colors duration-200'
                  )}
                  aria-label="View on SNPedia"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={clsx(
                'px-2 py-0.5 rounded text-xs font-mono',
                'bg-gray-100 dark:bg-white/10 text-[var(--text-primary)]'
              )}>
                {userGenotype}
              </span>
              {chrom && pos && (
                <span className="text-xs text-[var(--text-secondary)]">
                  Chr{chrom}:{pos?.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Magnitude */}
        <MagnitudeBadge magnitude={magnitude} size="md" />
      </div>

      {/* Summary */}
      <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
        {summary || 'No summary available for this variant.'}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <CategoryBadge category={category} size="sm" />

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick?.(match);
          }}
          className={clsx(
            'flex items-center gap-1',
            'text-sm text-cyan-400',
            'hover:text-cyan-300',
            'transition-colors duration-200'
          )}
        >
          <Info className="w-4 h-4" />
          <span>Details</span>
        </button>
      </div>
    </motion.div>
  );
}

export default SNPCard;
