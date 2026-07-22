import { ShoppingBag } from 'lucide-react';
import { Avatar } from '../../components/common/Avatar.jsx';
import { RiskBadge } from '../../components/common/RiskBadge.jsx';
import { OrderStatusBadge, PaymentBadge } from '../../components/common/StatusBadge.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { nprLabel, relativeTime } from '../../lib/format.js';

export function OrderList({ orders, isLoading, onOpen }) {
  if (isLoading) {
    return (
      <div className="card divide-y divide-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          description="Capture an order from the inbox, or create one here."
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2 sm:hidden">
        {orders.map((o) => (
          <button
            key={o._id}
            onClick={() => onOpen(o._id)}
            className="card w-full p-4 text-left active:bg-surface-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-fg">{o.orderNumber}</span>
              <OrderStatusBadge status={o.status} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Avatar name={o.customer?.name || o.phone} size="xs" />
              <span className="flex-1 truncate text-sm text-fg-secondary">
                {o.customer?.name || o.phone}
              </span>
              <span className="font-semibold text-fg">{nprLabel(o.totalPaisa)}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="card hidden overflow-hidden sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2/60 text-left text-2xs font-medium uppercase tracking-wider text-fg-muted">
              <th className="px-4 py-2.5">Order</th>
              <th className="px-4 py-2.5">Customer</th>
              <th className="px-4 py-2.5">Items</th>
              <th className="px-4 py-2.5">Payment</th>
              <th className="px-4 py-2.5 text-right">Total</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-right">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((o) => (
              <tr
                key={o._id}
                onClick={() => onOpen(o._id)}
                className="cursor-pointer transition-colors hover:bg-surface-2/50"
              >
                <td className="px-4 py-3 font-medium text-fg">{o.orderNumber}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={o.customer?.name || o.phone} size="xs" />
                    <div className="min-w-0">
                      <p className="truncate text-fg">{o.customer?.name || 'Unknown'}</p>
                      <p className="truncate text-xs text-fg-muted">{o.phone}</p>
                    </div>
                    {o.customer?.riskCache?.label && o.customer.riskCache.label !== 'new' && (
                      <RiskBadge label={o.customer.riskCache.label} />
                    )}
                  </div>
                </td>
                <td className="max-w-[180px] truncate px-4 py-3 text-fg-secondary">
                  {o.items.map((i) => `${i.qty}× ${i.productName}`).join(', ')}
                </td>
                <td className="px-4 py-3">
                  <PaymentBadge type={o.paymentType} />
                </td>
                <td className="px-4 py-3 text-right font-medium text-fg">{nprLabel(o.totalPaisa)}</td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3 text-right text-xs text-fg-muted">
                  {relativeTime(o.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
