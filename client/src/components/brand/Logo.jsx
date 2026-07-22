import { cn } from '../../lib/cn.js';

/** DokaanDM wordmark + solid brand mark. */
export function Logo({ className, showText = true, size = 'md', inverted = false }) {
  const dims = size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-9 w-9' : 'h-8 w-8';
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-xl' : 'text-lg';

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'grid place-items-center rounded-lg bg-brand text-brand-fg',
          dims,
          inverted && 'bg-white text-brand'
        )}
      >
        <svg viewBox="0 0 32 32" className="h-2/3 w-2/3" aria-hidden>
          <path
            d="M9 22V10h5.2c3.7 0 6.3 2.4 6.3 6s-2.6 6-6.3 6H9Zm3.2-2.7h1.8c2 0 3.3-1.3 3.3-3.3s-1.3-3.3-3.3-3.3h-1.8v6.6Z"
            fill="currentColor"
          />
          <circle cx="23.5" cy="21.5" r="2.2" fill="currentColor" />
        </svg>
      </div>
      {showText && (
        <span
          className={cn(
            'font-semibold tracking-tight',
            textSize,
            inverted ? 'text-white' : 'text-fg'
          )}
        >
          Dokaan<span className={inverted ? 'text-white/80' : 'text-brand'}>DM</span>
        </span>
      )}
    </div>
  );
}
