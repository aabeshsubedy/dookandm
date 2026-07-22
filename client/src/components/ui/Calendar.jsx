import { useMemo } from 'react';
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn.js';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * Modern month calendar grid.
 * @param {Date} month - Visible month
 * @param {Date|null} selected - Selected day
 * @param {(d: Date) => void} onSelect - Day click
 * @param {(d: Date) => void} onMonthChange
 * @param {Record<string, number|{count:number, overdue?:boolean}>} markers - keyed by yyyy-MM-dd
 * @param {boolean} showOutsideDays
 */
export function Calendar({
  month,
  selected,
  onSelect,
  onMonthChange,
  markers = {},
  showOutsideDays = true,
  className,
}) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  const today = startOfDay(new Date());

  return (
    <div className={cn('select-none', className)}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <p className="text-lg font-semibold tracking-tight text-fg">
            {format(month, 'MMMM yyyy')}
          </p>
          <p className="text-xs text-fg-muted">Pick a day to focus follow-ups</p>
        </div>
        <div className="flex items-center gap-1">
          <NavBtn
            onClick={() => onMonthChange?.(subMonths(month, 1))}
            label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </NavBtn>
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              onMonthChange?.(now);
              onSelect?.(now);
            }}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-fg-secondary transition-colors hover:bg-surface-2 hover:text-fg"
          >
            Today
          </button>
          <NavBtn onClick={() => onMonthChange?.(addMonths(month, 1))} label="Next month">
            <ChevronRight className="h-4 w-4" />
          </NavBtn>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-1.5 text-center text-2xs font-semibold uppercase tracking-wider text-fg-muted"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const inMonth = isSameMonth(day, month);
          if (!showOutsideDays && !inMonth) {
            return <div key={key} className="aspect-square" />;
          }

          const marker = markers[key];
          const count = typeof marker === 'number' ? marker : marker?.count || 0;
          const hasOverdue = typeof marker === 'object' && marker?.overdue;
          const selectedDay = selected && isSameDay(day, selected);
          const todayDay = isToday(day);
          const past = isBefore(startOfDay(day), today) && !todayDay;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect?.(day)}
              className={cn(
                'group relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-medium transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
                !inMonth && 'opacity-35',
                selectedDay
                  ? 'bg-brand text-brand-fg shadow-sm shadow-brand/25'
                  : todayDay
                    ? 'bg-brand-soft text-brand ring-1 ring-brand/30'
                    : 'text-fg hover:bg-surface-2',
                past && !selectedDay && inMonth && 'text-fg-muted'
              )}
            >
              <span className="relative z-10 tabular-nums">{format(day, 'd')}</span>

              {/* Event dots */}
              {count > 0 && (
                <span
                  className={cn(
                    'absolute bottom-1.5 flex items-center gap-0.5',
                    selectedDay ? 'opacity-100' : ''
                  )}
                >
                  {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        'h-1 w-1 rounded-full',
                        selectedDay
                          ? 'bg-brand-fg'
                          : hasOverdue
                            ? 'bg-danger'
                            : 'bg-brand'
                      )}
                    />
                  ))}
                </span>
              )}

              {/* Subtle hover glow ring for futuristic feel */}
              {!selectedDay && (
                <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-transparent transition group-hover:ring-border" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NavBtn({ children, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface text-fg-secondary transition-colors hover:bg-surface-2 hover:text-fg"
    >
      {children}
    </button>
  );
}

/**
 * Compact calendar for popovers / date fields.
 */
export function MiniCalendar({ month, selected, onSelect, onMonthChange, className }) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  return (
    <div
      className={cn(
        'w-[280px] rounded-xl border border-border bg-surface p-3 shadow-lg ring-1 ring-border/60',
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange?.(subMonths(month, 1))}
          className="grid h-7 w-7 place-items-center rounded-md text-fg-secondary hover:bg-surface-2"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-fg">{format(month, 'MMM yyyy')}</span>
        <button
          type="button"
          onClick={() => onMonthChange?.(addMonths(month, 1))}
          className="grid h-7 w-7 place-items-center rounded-md text-fg-secondary hover:bg-surface-2"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1 text-center text-2xs font-medium text-fg-muted">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day) => {
          const inMonth = isSameMonth(day, month);
          const selectedDay = selected && isSameDay(day, selected);
          const todayDay = isToday(day);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect?.(day)}
              className={cn(
                'grid h-8 place-items-center rounded-lg text-xs font-medium transition-colors',
                !inMonth && 'text-fg-muted/50',
                selectedDay
                  ? 'bg-brand text-brand-fg'
                  : todayDay
                    ? 'bg-brand-soft text-brand'
                    : 'text-fg hover:bg-surface-2'
              )}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
