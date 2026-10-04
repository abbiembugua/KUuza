import React from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary:   'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:bg-emerald-600/50',
  secondary: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-transparent dark:text-gray-200 dark:hover:bg-gray-800 disabled:opacity-50',
  danger:    'bg-red-600 hover:bg-red-700 text-white shadow-sm disabled:bg-red-600/50',
  ghost:     'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-50',
  warning:   'bg-amber-500 hover:bg-amber-600 text-white shadow-sm disabled:bg-amber-500/50',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2',
};

const SharedButton = ({
  as: Component = 'button',
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon: Icon,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <Component
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40',
        'disabled:cursor-not-allowed',
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        fullWidth ? 'w-full' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 12 : size === 'lg' ? 18 : 15} className="animate-spin flex-shrink-0" />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 12 : size === 'lg' ? 18 : 15} className="flex-shrink-0" />
      ) : null}
      {children}
    </Component>
  );
};

export default SharedButton;