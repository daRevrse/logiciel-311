import React from 'react';
import { ThumbsUp } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:   'bg-turquoise text-navy-deep hover:bg-turquoise/90 focus:ring-turquoise',
    secondary: 'border-2 border-navy-deep text-navy-deep bg-white hover:bg-navy-deep/5 focus:ring-navy-deep',
    support:   'bg-support text-white hover:bg-support-dark focus:ring-support',
    danger:    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline:   'border-2 border-slate-200 text-navy-deep hover:bg-slate-50 hover:border-turquoise focus:ring-turquoise',
    ghost:     'text-slate-600 hover:bg-slate-100 focus:ring-slate-400',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2',
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const classes = `${baseClasses} ${variants[variant] || variants.primary} ${sizes[size]} ${widthClass} ${className}`;

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {variant === 'support' && !loading && <ThumbsUp className="h-4 w-4" />}
      {children}
    </button>
  );
};

export default Button;
