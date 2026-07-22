import { cn } from '../../lib/cn.js';
import { initials, avatarStyle } from '../../lib/format.js';

export function Avatar({ name, size = 'md', className }) {
  const dims = {
    xs: 'h-6 w-6 text-2xs',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  }[size];
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold', dims, className)}
      style={avatarStyle(name || '?')}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
