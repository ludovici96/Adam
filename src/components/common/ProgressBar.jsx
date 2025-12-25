import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export function ProgressBar({
  value = 0,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  label,
  animated = true,
  indeterminate = false,
  className
}) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  const sizes = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
    xl: 'h-4'
  };

  const variants = {
    default: 'bg-gradient-to-r from-cyan-500 to-indigo-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    dna: 'bg-gradient-to-r from-[var(--color-adenine)] via-[var(--color-guanine)] to-[var(--color-thymine)]'
  };

  return (
    <div className={clsx('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-[var(--text-secondary)]">
            {label || 'Progress'}
          </span>
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {Math.round(percent)}%
          </span>
        </div>
      )}

      <div
        className={clsx(
          'w-full bg-white/10 rounded-full overflow-hidden',
          sizes[size]
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || 'Progress'}
      >
        {indeterminate ? (
          <motion.div
            className={clsx('h-full w-1/3 rounded-full', variants[variant])}
            animate={{
              x: ['-100%', '400%']
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        ) : (
          <motion.div
            className={clsx('h-full rounded-full', variants[variant])}
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{
              duration: animated ? 0.5 : 0,
              ease: [0.4, 0, 0.2, 1]
            }}
          />
        )}
      </div>
    </div>
  );
}

// Circular progress indicator
export function CircularProgress({
  value = 0,
  max = 100,
  size = 'md',
  variant = 'default',
  showValue = false,
  className
}) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  const sizes = {
    sm: { size: 32, stroke: 3 },
    md: { size: 48, stroke: 4 },
    lg: { size: 64, stroke: 5 },
    xl: { size: 80, stroke: 6 }
  };

  const config = sizes[size];
  const radius = (config.size - config.stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  const colors = {
    default: 'stroke-cyan-500',
    success: 'stroke-emerald-500',
    warning: 'stroke-amber-500',
    danger: 'stroke-red-500'
  };

  return (
    <div
      className={clsx('relative inline-flex', className)}
      style={{ width: config.size, height: config.size }}
    >
      <svg
        className="transform -rotate-90"
        width={config.size}
        height={config.size}
      >
        {/* Background circle */}
        <circle
          className="stroke-white/10"
          strokeWidth={config.stroke}
          fill="none"
          r={radius}
          cx={config.size / 2}
          cy={config.size / 2}
        />
        {/* Progress circle */}
        <motion.circle
          className={colors[variant]}
          strokeWidth={config.stroke}
          strokeLinecap="round"
          fill="none"
          r={radius}
          cx={config.size / 2}
          cy={config.size / 2}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          style={{
            strokeDasharray: circumference
          }}
          transition={{
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1]
          }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-[var(--text-primary)]">
            {Math.round(percent)}%
          </span>
        </div>
      )}
    </div>
  );
}

export default ProgressBar;
