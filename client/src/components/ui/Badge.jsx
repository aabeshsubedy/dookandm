import { cn } from '../../lib/cn.js';

const tones = {
  neutral: 'bg-surface-2 text-fg-secondary',
  ocean: 'bg-brand-soft text-brand',
  teal: 'bg-brand-soft text-brand',
  cyan: 'bg-surface-2 text-fg-secondary',
  good: 'bg-success-soft text-success',
  warn: 'bg-warning-soft text-warning',
  bad: 'bg-danger-soft text-danger',
};

export function Badge({ tone = 'neutral', className, children, dot, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}
