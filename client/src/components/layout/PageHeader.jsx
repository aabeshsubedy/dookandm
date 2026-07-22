import { cn } from '../../lib/cn.js';

export function PageHeader({ title, description, action, className }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3', className)}>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-fg">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function Page({ children, className, wide = false }) {
  return (
    <div className={cn('h-full min-w-0 overflow-y-auto overflow-x-hidden bg-bg', className)}>
      <div
        className={cn(
          'mx-auto w-full min-w-0 px-4 py-6 lg:px-8 lg:py-7',
          wide ? 'max-w-none' : 'max-w-6xl'
        )}
      >
        {children}
      </div>
    </div>
  );
}
