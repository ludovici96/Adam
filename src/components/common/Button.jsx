import React from 'react';
import { motion } from 'framer-motion';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-full cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-400 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-stone-800 dark:bg-stone-700 text-white shadow-lg shadow-stone-800/25 hover:bg-stone-900 dark:hover:bg-stone-600 hover:shadow-xl hover:shadow-stone-800/30',
    secondary: 'bg-white/10 backdrop-blur-sm border border-stone-300 dark:border-white/20 hover:bg-stone-100 dark:hover:bg-white/20 text-stone-700 dark:text-white',
    ghost: 'bg-transparent hover:bg-stone-100 dark:hover:bg-white/10 text-stone-600 dark:text-stone-300',
    danger: 'bg-red-700 text-white shadow-lg shadow-red-700/25 hover:bg-red-800',
    success: 'bg-teal-600 text-white shadow-lg shadow-teal-600/25 hover:bg-teal-700'
  };

  const sizes = {
    xs: 'px-2.5 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  };

  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      {...props}
    >
      {loading ? (
        <LoadingSpinner className={iconSizes[size]} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className={iconSizes[size]}>{icon}</span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <span className={iconSizes[size]}>{icon}</span>
          )}
        </>
      )}
    </motion.button>
  );
}

function LoadingSpinner({ className }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default Button;
