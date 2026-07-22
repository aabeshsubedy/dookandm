import { Facebook, Instagram } from 'lucide-react';
import { cn } from '../../lib/cn.js';

export function ChannelBadge({ type, size = 'md', withLabel = false, className }) {
  const isIg = type === 'instagram';
  const dims = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const Icon = isIg ? Instagram : Facebook;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        withLabel && 'rounded-md px-1.5 py-0.5 text-xs font-medium',
        withLabel &&
          (isIg
            ? 'bg-[#E1306C]/10 text-[#E1306C] dark:bg-[#E1306C]/15 dark:text-[#f472b6]'
            : 'bg-[#1877F2]/10 text-[#1877F2] dark:bg-[#1877F2]/15 dark:text-[#4b9bff]'),
        className
      )}
      title={isIg ? 'Instagram' : 'Facebook'}
    >
      <Icon
        className={cn(
          dims,
          isIg ? 'text-[#E1306C] dark:text-[#f472b6]' : 'text-[#1877F2] dark:text-[#4b9bff]'
        )}
        aria-label={isIg ? 'Instagram' : 'Facebook'}
      />
      {withLabel && <span>{isIg ? 'Instagram' : 'Facebook'}</span>}
    </span>
  );
}

export function ChannelDot({ type, className }) {
  const isIg = type === 'instagram';
  const Icon = isIg ? Instagram : Facebook;
  return (
    <span
      className={cn(
        'grid h-4 w-4 place-items-center rounded-full ring-2 ring-surface',
        isIg ? 'bg-[#E1306C]' : 'bg-[#1877F2]',
        className
      )}
    >
      <Icon className="h-2.5 w-2.5 text-white" aria-hidden />
    </span>
  );
}
