import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  animated = true,
  className,
  onClick,
  ...props
}) {
  const baseStyles = `
    rounded-2xl
    border border-white/10
    transition-all duration-200
  `;

  const variants = {
    default: `
      bg-white/5 backdrop-blur-sm
    `,
    elevated: `
      bg-white/10 backdrop-blur-md
      shadow-lg
    `,
    glass: `
      bg-white/5 backdrop-blur-xl
      border-white/20
    `,
    solid: `
      bg-[var(--bg-secondary)]
      border-[var(--border-color)]
    `,
    interactive: `
      bg-white/5 backdrop-blur-sm
      cursor-pointer
      hover:bg-white/10
      hover:border-white/20
      hover:shadow-lg
      active:scale-[0.99]
    `
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  const Component = animated ? motion.div : 'div';
  const animationProps = animated ? {
    initial: 'hidden',
    animate: 'visible',
    variants: cardVariants
  } : {};

  return (
    <Component
      className={clsx(
        baseStyles,
        variants[variant],
        paddings[padding],
        hover && 'hover:shadow-lg hover:border-white/20',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      {...animationProps}
      {...props}
    >
      {children}
    </Component>
  );
}

// Card subcomponents for structured layouts
export function CardHeader({ children, className, ...props }) {
  return (
    <div
      className={clsx(
        'flex items-center justify-between mb-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }) {
  return (
    <h3
      className={clsx(
        'text-lg font-semibold text-[var(--text-primary)]',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className, ...props }) {
  return (
    <p
      className={clsx(
        'text-sm text-[var(--text-secondary)]',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={clsx('', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={clsx(
        'flex items-center gap-2 mt-4 pt-4 border-t border-white/10',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
