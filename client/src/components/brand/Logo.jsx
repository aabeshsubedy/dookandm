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
        {/* A "D" for dokaan whose counter is a speech bubble: the shop holds the
            conversation. Keep in sync with public/favicon.svg. */}
        <svg viewBox="0 0 32 32" className="h-2/3 w-2/3" aria-hidden>
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M6.5 4.5H14.5C21.4 4.5 25.5 9.6 25.5 16C25.5 22.4 21.4 27.5 14.5 27.5H6.5V4.5ZM10.9 9V18.7H11.9V22.9L15.6 18.7H18.1C20 18.7 21.3 17.4 21.3 15.6V12.1C21.3 10.3 20 9 18.1 9H10.9Z"
            fill="currentColor"
          />
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
