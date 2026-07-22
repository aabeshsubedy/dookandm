import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X, Bell } from 'lucide-react';
import { useToastStore } from '../../store/toastStore.js';
import { cn } from '../../lib/cn.js';

const config = {
  success: { icon: CheckCircle2, accent: 'text-success', bar: 'bg-success' },
  danger: { icon: AlertCircle, accent: 'text-danger', bar: 'bg-danger' },
  info: { icon: Info, accent: 'text-brand', bar: 'bg-brand' },
  default: { icon: Bell, accent: 'text-fg-secondary', bar: 'bg-fg-muted' },
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  return createPortal(
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const c = config[t.variant] || config.default;
        const Icon = c.icon;
        return (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-xl border border-border bg-surface py-3 pl-3.5 pr-2.5 shadow-md animate-slide-in-right"
          >
            <span className={cn('absolute left-0 top-0 h-full w-0.5', c.bar)} />
            <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', c.accent)} />
            <div className="min-w-0 flex-1">
              {t.title && <p className="text-sm font-semibold text-fg">{t.title}</p>}
              {t.message && <p className="break-words text-sm text-fg-secondary">{t.message}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="rounded-md p-1 text-fg-muted hover:bg-surface-2 hover:text-fg"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
