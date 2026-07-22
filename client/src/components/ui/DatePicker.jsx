import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { MiniCalendar } from './Calendar.jsx';
import { cn } from '../../lib/cn.js';

/**
 * Modern date picker. Value is yyyy-MM-dd (same as input[type=date]).
 * Popover is portaled so parent overflow (cards, scroll areas) cannot clip it.
 */
export function DatePicker({ value, onChange, className, placeholder = 'Select date', disabled }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => {
    if (value) {
      const d = parseISO(value);
      if (isValid(d)) return d;
    }
    return new Date();
  });
  const [pos, setPos] = useState({ top: 0, left: 0, openUp: false });
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const selected = value && isValid(parseISO(value)) ? parseISO(value) : null;

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const panelH = 320;
    const panelW = 280;
    const gap = 6;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < panelH + gap && rect.top > panelH + gap;

    let left = rect.left;
    if (left + panelW > window.innerWidth - 8) {
      left = Math.max(8, rect.right - panelW);
    }
    left = Math.max(8, left);

    setPos({
      // fixed coords relative to viewport
      top: openUp ? undefined : rect.bottom + gap,
      bottom: openUp ? window.innerHeight - rect.top + gap : undefined,
      left,
      openUp,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return undefined;
    updatePosition();
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener('resize', onResize);
    // capture scroll from any scroll parent
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      const t = e.target;
      if (triggerRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    // defer so the opening click doesn't immediately close
    const id = window.setTimeout(() => {
      document.addEventListener('mousedown', onDoc);
      document.addEventListener('keydown', onKey);
    }, 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    if (disabled) return;
    setOpen((o) => !o);
  };

  return (
    <div className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          'input-base flex h-10 w-full items-center gap-2 text-left',
          !selected && 'text-fg-muted',
          disabled && 'opacity-60',
          open && 'border-brand ring-2 ring-brand/20'
        )}
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-fg-muted" />
        <span className="flex-1 truncate text-sm">
          {selected ? format(selected, 'MMM d, yyyy') : placeholder}
        </span>
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Choose date"
            className="fixed z-[100] animate-slide-up"
            style={{
              top: pos.top,
              bottom: pos.bottom,
              left: pos.left,
            }}
          >
            <MiniCalendar
              month={month}
              selected={selected}
              onMonthChange={setMonth}
              onSelect={(day) => {
                onChange?.(format(day, 'yyyy-MM-dd'));
                setOpen(false);
              }}
            />
          </div>,
          document.body
        )}
    </div>
  );
}
