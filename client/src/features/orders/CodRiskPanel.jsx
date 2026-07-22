import { useQuery } from '@tanstack/react-query';
import { RISK_LABEL_META } from '@dokaandm/shared';
import { api } from '../../lib/api.js';
import { RiskBadge } from '../../components/common/RiskBadge.jsx';
import { Spinner } from '../../components/ui/Skeleton.jsx';
import { cn } from '../../lib/cn.js';

export function CodRiskPanel({ customerId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['customer', customerId, 'risk'],
    queryFn: () => api.get(`/customers/${customerId}/risk`).then((r) => r.data.data.risk),
    enabled: !!customerId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-4 text-sm text-fg-muted">
        <Spinner className="h-4 w-4" /> Checking history…
      </div>
    );
  }
  if (!data) return null;

  const meta = RISK_LABEL_META[data.label];
  const returnPct = Math.round((data.returnRate || 0) * 100);

  return (
    <div
      className={cn(
        'rounded-xl border bg-surface p-3.5',
        data.label === 'risky' && 'border-danger/25',
        data.label === 'medium' && 'border-warning/25',
        data.label === 'reliable' && 'border-success/25',
        data.label === 'new' && 'border-border'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <RiskBadge label={data.label} size="md" />
        <span className="text-sm font-semibold tabular-nums text-fg">{returnPct}% return</span>
      </div>
      {meta?.description && (
        <p className="mt-2 text-xs leading-relaxed text-fg-secondary">{meta.description}</p>
      )}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="Delivered" value={data.deliveredOrders} tone="good" />
        <Stat label="Returned" value={data.returnedOrders} tone="bad" />
        <Stat label="Completed" value={data.totalCompleted} tone="neutral" />
      </div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="rounded-lg bg-surface-2/80 px-2 py-2 text-center">
      <p
        className={cn(
          'text-base font-semibold tabular-nums tracking-tight',
          tone === 'good' && 'text-success',
          tone === 'bad' && 'text-danger',
          tone === 'neutral' && 'text-fg'
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-2xs font-medium uppercase tracking-wide text-fg-muted">{label}</p>
    </div>
  );
}
