import { cn } from '../../lib/cn.js';

export function Skeleton({ className }) {
  return <div className={cn('skeleton h-4 w-full', className)} aria-hidden />;
}

export function Spinner({ className }) {
  return (
    <svg className={cn('animate-spin text-brand', className)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"
      />
    </svg>
  );
}

export function LoadingPanel({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-fg-muted">
      <Spinner className="h-6 w-6" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
