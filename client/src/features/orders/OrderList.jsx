import { ShoppingBag, ChevronRight, Package } from 'lucide-react';
import { Avatar } from '../../components/common/Avatar.jsx';
import { RiskBadge } from '../../components/common/RiskBadge.jsx';
import { OrderStatusBadge, PaymentBadge } from '../../components/common/StatusBadge.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { nprLabel, relativeTime } from '../../lib/format.js';
import { cn } from '../../lib/cn.js';

export function OrderList({ orders, isLoading, onOpen }) {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-border/70 px-4 py-3.5 last:border-0"
          >
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="hidden h-5 w-16 rounded-md sm:block" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface shadow-xs">
        <EmptyState
          icon={ShoppingBag}
          title="No orders match"
          description="Capture an order from the inbox, create one here, or clear your filters."
          className="py-14"
        />
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <ul className="space-y-2 sm:hidden">
        {orders.map((o) => (
          <li key={o._id}>
            <button
              type="button"
              onClick={() => onOpen(o._id)}
              className={cn(
                'w-full rounded-2xl border border-border bg-surface p-4 text-left shadow-xs',
                'transition-colors active:bg-surface-2'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold tabular-nums tracking-tight text-fg">
                    {o.orderNumber}
                  </p>
                  <p className="mt-0.5 text-2xs text-fg-muted">{relativeTime(o.createdAt)}</p>
                </div>
                <OrderStatusBadge status={o.status} />
              </div>
              <div className="mt-3 flex items-center gap-2.5">
                <Avatar name={o.customer?.name || o.phone} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">
                    {o.customer?.name || o.phone || 'Unknown'}
                  </p>
                  <p className="truncate text-xs text-fg-muted">
                    {(o.items || []).map((i) => `${i.qty}× ${i.productName}`).join(', ') ||
                      'No items'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums text-fg">
                    {nprLabel(o.totalPaisa)}
                  </p>
                  <div className="mt-1 flex justify-end">
                    <PaymentBadge type={o.paymentType} />
                  </div>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface shadow-xs sm:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/40 text-left">
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-wider text-fg-muted">
                  Order
                </th>
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-wider text-fg-muted">
                  Customer
                </th>
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-wider text-fg-muted">
                  Items
                </th>
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-wider text-fg-muted">
                  Payment
                </th>
                <th className="px-4 py-3 text-right text-2xs font-semibold uppercase tracking-wider text-fg-muted">
                  Total
                </th>
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-wider text-fg-muted">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-2xs font-semibold uppercase tracking-wider text-fg-muted">
                  When
                </th>
                <th className="w-8 px-2 py-3" aria-hidden />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {orders.map((o) => {
                const name = o.customer?.name || 'Unknown';
                const risk = o.customer?.riskCache?.label;
                const itemSummary =
                  (o.items || []).map((i) => `${i.qty}× ${i.productName}`).join(', ') || '—';
                return (
                  <tr
                    key={o._id}
                    onClick={() => onOpen(o._id)}
                    className="group cursor-pointer transition-colors hover:bg-surface-2/50"
                  >
                    <td className="px-4 py-3">
                      <span className="font-semibold tabular-nums tracking-tight text-fg">
                        {o.orderNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar name={name !== 'Unknown' ? name : o.phone} size="sm" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate font-medium text-fg">{name}</p>
                            {risk && risk !== 'new' && <RiskBadge label={risk} />}
                          </div>
                          <p className="truncate text-xs text-fg-muted">{o.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[200px] px-4 py-3">
                      <div className="flex items-center gap-1.5 text-fg-secondary">
                        <Package className="h-3.5 w-3.5 shrink-0 text-fg-muted" strokeWidth={1.75} />
                        <span className="truncate" title={itemSummary}>
                          {itemSummary}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <PaymentBadge type={o.paymentType} />
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-fg">
                      {nprLabel(o.totalPaisa)}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-xs tabular-nums text-fg-muted">
                      {relativeTime(o.createdAt)}
                    </td>
                    <td className="px-2 py-3">
                      <ChevronRight className="h-4 w-4 text-fg-muted opacity-0 transition-opacity group-hover:opacity-50" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
