import { Facebook, Instagram, MessageCircle } from 'lucide-react';
import { cn } from '../../lib/cn.js';

/**
 * Static channel icons for auth / marketing strips.
 * Solid platform colors only — no gradients or animation.
 */
export function SocialBrandRow({ className }) {
  const items = [
    {
      Icon: Facebook,
      label: 'Facebook',
      className: 'bg-[#1877F2]/10 text-[#1877F2] dark:bg-[#1877F2]/15 dark:text-[#4b9bff]',
    },
    {
      Icon: Instagram,
      label: 'Instagram',
      className: 'bg-[#E1306C]/10 text-[#E1306C] dark:bg-[#E1306C]/15 dark:text-[#f472b6]',
    },
    {
      Icon: MessageCircle,
      label: 'Messenger',
      className: 'bg-[#006AFF]/10 text-[#006AFF] dark:bg-[#006AFF]/15 dark:text-[#60a5fa]',
    },
  ];

  return (
    <div className={cn('flex items-center justify-center gap-2.5', className)}>
      {items.map(({ Icon, label, className: tone }) => (
        <div
          key={label}
          className={cn(
            'grid h-10 w-10 place-items-center rounded-lg border border-border',
            tone
          )}
          title={label}
          aria-label={label}
        >
          <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
        </div>
      ))}
    </div>
  );
}

/** @deprecated Use SocialBrandRow — kept as alias for any old imports. */
export function SocialOrbit({ className }) {
  return <SocialBrandRow className={className} />;
}
