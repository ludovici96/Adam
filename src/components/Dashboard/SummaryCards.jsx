import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import {
  Dna,
  Target,
  AlertTriangle,
  ThumbsUp,
  Activity,
  Clock
} from 'lucide-react';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  })
};

export function SummaryCards({
  totalVariants = 0,
  totalMatches = 0,
  notableCount = 0,
  positiveCount = 0,
  processingTime = null
}) {
  const cards = [
    {
      label: 'Variants Analyzed',
      value: totalVariants.toLocaleString(),
      icon: Dna,
      color: 'cyan',
      gradient: 'from-cyan-500/20 to-cyan-600/20',
      iconColor: 'text-cyan-400'
    },
    {
      label: 'SNP Matches',
      value: totalMatches.toLocaleString(),
      icon: Target,
      color: 'indigo',
      gradient: 'from-indigo-500/20 to-indigo-600/20',
      iconColor: 'text-indigo-400'
    },
    {
      label: 'Notable Findings',
      value: notableCount.toLocaleString(),
      icon: AlertTriangle,
      color: 'amber',
      gradient: 'from-amber-500/20 to-orange-500/20',
      iconColor: 'text-amber-400',
      description: 'Magnitude 2+'
    },
    {
      label: 'Positive Traits',
      value: positiveCount.toLocaleString(),
      icon: ThumbsUp,
      color: 'emerald',
      gradient: 'from-emerald-500/20 to-green-500/20',
      iconColor: 'text-emerald-400'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          custom={index}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className={clsx(
            'relative p-5 rounded-2xl',
            'bg-gray-50 dark:bg-white/5 backdrop-blur-sm',
            'border border-gray-200 dark:border-white/10',
            'transition-all duration-300',
            'hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20',
            'group'
          )}
        >
          {/* Icon */}
          <div className={clsx(
            'w-10 h-10 rounded-xl mb-4',
            'flex items-center justify-center',
            `bg-gradient-to-br ${card.gradient}`,
            'transition-transform duration-300',
            'group-hover:scale-110'
          )}>
            <card.icon className={clsx('w-5 h-5', card.iconColor)} />
          </div>

          {/* Value */}
          <p className={clsx(
            'text-3xl font-bold',
            'text-[var(--text-primary)]',
            'mb-1'
          )}>
            {card.value}
          </p>

          {/* Label */}
          <p className="text-sm text-[var(--text-secondary)]">
            {card.label}
          </p>

          {/* Optional description */}
          {card.description && (
            <p className="text-xs text-[var(--text-secondary)]/60 mt-1">
              {card.description}
            </p>
          )}
        </motion.div>
      ))}

      {/* Processing time badge */}
      {processingTime && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={clsx(
            'col-span-2 lg:col-span-4',
            'flex items-center justify-center gap-2',
            'mt-2 text-sm text-[var(--text-secondary)]'
          )}
        >
          <Clock className="w-4 h-4" />
          <span>Analyzed in {processingTime}s</span>
        </motion.div>
      )}
    </div>
  );
}

export default SummaryCards;
