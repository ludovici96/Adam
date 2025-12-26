import React from 'react';
import { clsx } from 'clsx';

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  rounded = 'full',
  className,
  ...props
}) {
  const baseStyles = `
    inline-flex items-center justify-center
    font-medium whitespace-nowrap
    transition-colors duration-200
  `;

  const variants = {
    default: `
      bg-white/10 text-[var(--text-primary)]
      border border-white/10
    `,
    primary: `
      bg-gradient-to-r from-cyan-500/20 to-indigo-500/20
      text-cyan-300
      border border-cyan-500/30
    `,

    // Risk levels (ClinVar-style)
    critical: `
      bg-red-500/20 text-red-300
      border border-red-500/30
    `,
    high: `
      bg-orange-500/20 text-orange-300
      border border-orange-500/30
    `,
    moderate: `
      bg-yellow-500/20 text-yellow-300
      border border-yellow-500/30
    `,
    low: `
      bg-green-500/20 text-green-300
      border border-green-500/30
    `,
    benign: `
      bg-emerald-500/20 text-emerald-300
      border border-emerald-500/30
    `,

    // Repute variants
    good: `
      bg-emerald-500/20 text-emerald-300
      border border-emerald-500/30
    `,
    bad: `
      bg-red-500/20 text-red-300
      border border-red-500/30
    `,
    neutral: `
      bg-gray-500/20 text-gray-300
      border border-gray-500/30
    `,

    // Category variants
    health: `
      bg-red-500/20 text-red-300
      border border-red-500/30
    `,
    traits: `
      bg-purple-500/20 text-purple-300
      border border-purple-500/30
    `,
    ancestry: `
      bg-orange-500/20 text-orange-300
      border border-orange-500/30
    `,
    pharmacogenomics: `
      bg-blue-500/20 text-blue-300
      border border-blue-500/30
    `,
    carrier: `
      bg-pink-500/20 text-pink-300
      border border-pink-500/30
    `,

    // Outline variant
    outline: `
      bg-transparent
      border border-white/30
      text-[var(--text-secondary)]
    `
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  const roundedVariants = {
    none: 'rounded-none',
    sm: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  };

  return (
    <span
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        roundedVariants[rounded],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// Magnitude badge with automatic color coding
export function MagnitudeBadge({ magnitude, repute, size = 'md', className }) {
  const getVariant = (mag, rep) => {
    const r = rep?.toLowerCase();

    // For good/beneficial repute, use green shades
    if (r === 'good') {
      if (mag >= 3) return 'benign';  // bright green for high-impact good
      if (mag >= 2) return 'low';     // green
      return 'benign';                 // light green
    }

    // For bad/risk repute, use red/orange shades
    if (r === 'bad') {
      if (mag >= 4) return 'critical';
      if (mag >= 3) return 'high';
      if (mag >= 2) return 'moderate';
      return 'low';
    }

    // Default: use magnitude-based coloring
    if (mag >= 4) return 'critical';
    if (mag >= 3) return 'high';
    if (mag >= 2) return 'moderate';
    if (mag >= 1) return 'low';
    return 'benign';
  };

  return (
    <Badge
      variant={getVariant(magnitude, repute)}
      size={size}
      className={className}
    >
      {typeof magnitude === 'number' ? magnitude.toFixed(1) : magnitude}
    </Badge>
  );
}

// Repute badge
export function ReputeBadge({ repute, size = 'sm', className }) {
  const labels = {
    good: 'Beneficial',
    bad: 'Risk',
    neutral: 'Neutral'
  };

  return (
    <Badge
      variant={repute || 'neutral'}
      size={size}
      className={className}
    >
      {labels[repute] || 'Unknown'}
    </Badge>
  );
}

// Category badge with icon
export function CategoryBadge({ category, size = 'sm', className }) {
  const labels = {
    health: 'Health',
    traits: 'Traits',
    ancestry: 'Ancestry',
    pharmacogenomics: 'Pharma',
    carrier: 'Carrier',
    other: 'Other'
  };

  return (
    <Badge
      variant={category || 'default'}
      size={size}
      className={className}
    >
      {labels[category] || category || 'Other'}
    </Badge>
  );
}

export default Badge;
