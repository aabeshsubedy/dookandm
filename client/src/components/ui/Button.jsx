import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn.js';

const variants = {
  primary:
    'bg-brand text-brand-fg hover:bg-brand-hover active:bg-brand-active disabled:opacity-50',
  brand:
    'bg-brand text-brand-fg hover:bg-brand-hover active:bg-brand-active disabled:opacity-50',
  secondary:
    'bg-surface text-fg border border-border hover:bg-surface-2 active:bg-surface-2 disabled:text-fg-muted',
  ghost: 'text-fg-secondary hover:bg-surface-2 hover:text-fg disabled:text-fg-muted',
  teal: 'bg-brand text-brand-fg hover:bg-brand-hover active:bg-brand-active disabled:opacity-50',
  danger: 'bg-danger text-white hover:opacity-90 disabled:opacity-50',
  'danger-ghost': 'text-danger hover:bg-danger-soft',
};

const sizes = {
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-9 px-3.5 text-base gap-2 rounded-lg',
  lg: 'h-10 px-4 text-md gap-2 rounded-lg',
  icon: 'h-9 w-9 rounded-lg',
};

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className, loading, disabled, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors duration-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:cursor-not-allowed select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
