import { useQuery } from '@tanstack/react-query';
import { RISK_LABEL_META } from '@dokaandm/shared';
import { api } from '../../lib/api.js';
import { RiskBadge } from '../../components/common/RiskBadge.jsx';
import { Spinner } from '../../components/ui/Skeleton.jsx';

export function CodRiskPanel({ customerId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['customer', customerId, 'risk'],
    queryFn: () => api.get(`/customers/${customerId}/risk`).then((r) => r.data.data.risk),
    enabled: !!customerId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-fg-muted">
        <Spinner className="h-4 w-4" /> Checking history…
      </div>
    );
  }
  if (!data) return null;

  const meta = RISK_LABEL_META[data.label];
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center justify-between">
        <RiskBadge label={data.label} size="md" />
        <span className="text-sm font-semibold text-fg">
          {Math.round((data.returnRate || 0) * 100)}% return rate
        </span>
      </div>
      <p className="mt-2 text-sm text-fg-secondary">{meta?.description}</p>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <Stat label="Delivered" value={data.deliveredOrders} tone="text-success" />
        <Stat label="Returned" value={data.returnedOrders} tone="text-danger" />
        <Stat label="Completed" value={data.totalCompleted} tone="text-fg" />
      </div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="rounded-lg bg-surface-2 py-2">
      <p className={`text-lg font-bold ${tone}`}>{value}</p>
      <p className="text-2xs uppercase tracking-wide text-fg-muted">{label}</p>
    </div>
  );
}
