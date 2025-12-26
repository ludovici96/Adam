import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { ExternalLink, AlertTriangle, ThumbsUp, Minus, Info, Database } from 'lucide-react';
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
    pos,
    source,
    gwasAssociations
  } = match;

  const getReputeStyles = () => {
    // Magnitude 0 or very low = always neutral, regardless of repute
    if (magnitude === 0 || magnitude < 0.5) {
      return {
        border: 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20',
        bg: 'bg-gray-50 dark:bg-white/5',
        icon: Minus,
        iconColor: 'text-gray-500 dark:text-gray-400'
      };
    }

    const r = repute?.toLowerCase();
    switch (r) {
      case 'bad':
        return {
          border: 'border-red-200 dark:border-red-500/30 hover:border-red-300 dark:hover:border-red-500/50',
          bg: 'bg-red-50 dark:bg-red-500/5',
          icon: AlertTriangle,
          iconColor: 'text-red-600 dark:text-red-400'
        };
      case 'good':
        return {
          border: 'border-teal-200 dark:border-teal-500/30 hover:border-teal-300 dark:hover:border-teal-500/50',
          bg: 'bg-teal-50 dark:bg-teal-500/5',
          icon: ThumbsUp,
          iconColor: 'text-teal-600 dark:text-teal-400'
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
          <MagnitudeBadge magnitude={magnitude} repute={repute} size="sm" />
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
            repute?.toLowerCase() === 'bad' && 'bg-red-500/10',
            repute?.toLowerCase() === 'good' && 'bg-emerald-500/10',
            repute?.toLowerCase() === 'neutral' && 'bg-gray-500/10'
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
        <MagnitudeBadge magnitude={magnitude} repute={repute} size="md" />
      </div>

      {/* Summary */}
      <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
        {summary || 'No summary available for this variant.'}
      </p>

      {/* GWAS Associations */}
      {gwasAssociations && gwasAssociations.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
          <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-indigo-400">
            <Database className="w-3.5 h-3.5" />
            GWAS Trait Associations
          </div>
          <div className="space-y-1.5">
            {gwasAssociations.slice(0, 3).map((assoc, idx) => (
              <div key={idx} className="text-xs text-[var(--text-secondary)]">
                <span className="font-medium text-[var(--text-primary)]">{assoc.trait}</span>
                {assoc.pValue && (
                  <span className="ml-2 text-indigo-400">p={assoc.pValue.toExponential(1)}</span>
                )}
                {assoc.orBeta && (
                  <span className="ml-2 text-stone-400">OR={assoc.orBeta.toFixed(2)}</span>
                )}
              </div>
            ))}
            {gwasAssociations.length > 3 && (
              <div className="text-xs text-indigo-400">
                +{gwasAssociations.length - 3} more associations
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CategoryBadge category={category} size="sm" />
          {source && (
            <span className={clsx(
              'px-2 py-0.5 rounded text-xs font-medium',
              source === 'snpedia' && 'bg-cyan-500/10 text-cyan-400',
              source === 'clinvar' && 'bg-amber-500/10 text-amber-400',
              source === 'gwas' && 'bg-indigo-500/10 text-indigo-400'
            )}>
              {source === 'snpedia' ? 'SNPedia' : source === 'clinvar' ? 'ClinVar' : 'GWAS'}
            </span>
          )}
        </div>

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
