import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';

export const Input = forwardRef(function Input({ className, invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'input-base',
        invalid && 'border-danger focus:border-danger focus:ring-danger/20',
        className
      )}
      {...props}
    />
  );
});

export const Textarea = forwardRef(function Textarea({ className, invalid, rows = 3, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'input-base min-h-[72px] resize-y',
        invalid && 'border-danger focus:border-danger focus:ring-danger/20',
        className
      )}
      {...props}
    />
  );
});

export const Select = forwardRef(function Select({ className, invalid, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        'input-base appearance-none bg-no-repeat pr-9',
        invalid && 'border-danger',
        className
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundPosition: 'right 0.65rem center',
      }}
      {...props}
    >
      {children}
    </select>
  );
});

export function Field({ label, error, hint, required, children, className }) {
  return (
    <div className={cn(className)}>
      {label && (
        <label className="label-base">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-fg-muted">{hint}</p>
      ) : null}
    </div>
  );
}
