import { Facebook, Instagram } from 'lucide-react';
import { cn } from '../../lib/cn.js';

/**
 * Floating Facebook + Instagram logos for the auth/login experience.
 * Decorative only — solid platform colors, subtle float motion.
 */
const floats = [
  {
    key: 'facebook',
    Icon: Facebook,
    label: 'Facebook',
    className:
      'bg-[#1877F2] text-white shadow-lg shadow-[#1877F2]/35',
    position: 'left-[10%] top-[16%]',
    size: 'h-14 w-14 sm:h-16 sm:w-16',
    iconSize: 'h-7 w-7 sm:h-8 sm:w-8',
    delay: '0s',
    duration: '5.5s',
  },
  {
    key: 'instagram',
    Icon: Instagram,
    label: 'Instagram',
    className: 'bg-[#E1306C] text-white shadow-lg shadow-[#E1306C]/35',
    position: 'right-[12%] top-[22%]',
    size: 'h-12 w-12 sm:h-14 sm:w-14',
    iconSize: 'h-6 w-6 sm:h-7 sm:w-7',
    delay: '0.9s',
    duration: '6.2s',
  },
  {
    key: 'facebook-sm',
    Icon: Facebook,
    label: 'Facebook',
    className: 'bg-[#1877F2]/90 text-white shadow-md shadow-[#1877F2]/25',
    position: 'right-[18%] bottom-[26%]',
    size: 'h-10 w-10',
    iconSize: 'h-5 w-5',
    delay: '1.4s',
    duration: '5.8s',
  },
  {
    key: 'instagram-sm',
    Icon: Instagram,
    label: 'Instagram',
    className: 'bg-[#E1306C]/90 text-white shadow-md shadow-[#E1306C]/25',
    position: 'left-[14%] bottom-[22%]',
    size: 'h-11 w-11',
    iconSize: 'h-5 w-5',
    delay: '0.4s',
    duration: '6.5s',
  },
];

export function FloatingSocial({ className }) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      aria-hidden
    >
      {/* Soft rings for depth without gradients */}
      <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
      <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.06]" />

      {floats.map(({ key, Icon, label, className: tile, position, size, iconSize, delay, duration }) => (
        <div
          key={key}
          className={cn('absolute animate-float-soft', position)}
          style={{ animationDelay: delay, animationDuration: duration }}
          title={label}
        >
          <div
            className={cn(
              'grid place-items-center rounded-2xl ring-1 ring-white/25',
              size,
              tile
            )}
          >
            <Icon className={iconSize} strokeWidth={1.75} />
          </div>
        </div>
      ))}
    </div>
  );
}
