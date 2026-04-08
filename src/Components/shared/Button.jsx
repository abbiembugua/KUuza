import React from 'react';

const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200';

const variantClasses = {
  primary: 'text-white',
  secondary: 'border',
  ghost: 'bg-transparent',
};

const SharedButton = ({
  as: Component = 'button',
  children,
  className = '',
  variant = 'primary',
  fullWidth = false,
  ...props
}) => {
  return (
    <Component
      className={`${baseClasses} ${variantClasses[variant] || ''} ${fullWidth ? 'w-full' : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
};

export default SharedButton;
