import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  ChevronRight,
  Package,
  StickyNote,
  Calendar,
} from 'lucide-react';
import { ORDER_STATUS_TRANSITIONS } from '@dokaandm/shared';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { OrderStatusBadge, PaymentBadge } from '../../components/common/StatusBadge.jsx';
import { RiskBadge } from '../../components/common/RiskBadge.jsx';
import { Avatar } from '../../components/common/Avatar.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { CodRiskPanel } from './CodRiskPanel.jsx';
import { nprLabel, fullDate } from '../../lib/format.js';
import { useOrder, useChangeOrderStatus } from '../../hooks/data.js';
import { apiError } from '../../lib/api.js';
import { toast } from '../../store/toastStore.js';
import { cn } from '../../lib/cn.js';

const nextLabels = {
  confirmed: 'Confirm order',
  shipped: 'Mark shipped',
  delivered: 'Mark delivered',
  returned: 'Mark returned',
  cancelled: 'Cancel order',
};

export function OrderDetailDrawer({ orderId, open, onClose }) {
  const { data: order, isLoading } = useOrder(open ? orderId : null);
  const changeStatus = useChangeOrderStatus();
  const [pendingConfirm, setPendingConfirm] = useState(null);

  const doChange = async (status) => {
    try {
      await changeStatus.mutateAsync({ id: orderId, status });
      toast.success(`Order moved to ${status}`);
      setPendingConfirm(null);
    } catch (err) {
      toast.error(apiError(err).message, 'Could not update');
    }
  };

  const handleTransition = (status) => {
    if (status === 'confirmed' && order?.paymentType === 'cod') {
      setPendingConfirm(status);
      return;
    }
    doChange(status);
  };

  const allowed = order ? ORDER_STATUS_TRANSITIONS[order.status] || [] : [];
  const customer = order?.customer;
  const risk = customer?.riskCache?.label;

  return (
    <Modal
      open={open}
      onClose={() => {
        setPendingConfirm(null);
        onClose();
      }}
      title={order ? order.orderNumber : 'Order'}
      description={order ? fullDate(order.createdAt) : undefined}
      size="md"
    >
      {isLoading || !order ? (
        <div className="space-y-4 py-2" aria-busy="true">
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Status row */}
          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentBadge type={order.paymentType} />
            {order.paymentReference && (
              <span className="rounded-md bg-surface-2 px-2 py-0.5 text-2xs font-medium text-fg-muted">
                Ref · {order.paymentReference}
              </span>
            )}
          </div>

          {/* Customer card */}
          {customer ? (
            <Link
              to={`/customers/${customer._id}`}
              onClick={onClose}
              className="group flex items-center gap-3 rounded-xl border border-border bg-bg p-3 transition-colors hover:border-border-strong hover:bg-surface-2/40"
            >
              <Avatar name={customer.name || order.phone} size="md" className="ring-2 ring-border" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-fg">
                    {customer.name || 'Unknown'}
                  </p>
                  {risk && risk !== 'new' && <RiskBadge label={risk} />}
                </div>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-fg-muted">
                  <Phone className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                  {order.phone}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-fg-muted opacity-40 transition-opacity group-hover:opacity-70" />
            </Link>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-bg p-3">
              <Avatar name={order.phone} size="md" />
              <div>
                <p className="text-sm font-semibold text-fg">{order.phone || 'No customer'}</p>
                <p className="text-xs text-fg-muted">No linked profile yet</p>
              </div>
            </div>
          )}

          {/* Line items */}
          <section>
            <SectionLabel icon={Package}>Items</SectionLabel>
            <div className="mt-2 overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border/70">
                  {order.items.map((it, i) => (
                    <tr key={i} className="bg-surface">
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-fg">{it.productName}</p>
                        {it.sku && (
                          <p className="mt-0.5 font-mono text-2xs text-fg-muted">{it.sku}</p>
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-center tabular-nums text-fg-muted">
                        ×{it.qty}
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium tabular-nums text-fg">
                        {nprLabel(it.unitPricePaisa * it.qty)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="space-y-0 border-t border-border bg-surface-2/30">
                <div className="flex justify-between px-3 py-2 text-sm">
                  <span className="text-fg-muted">Shipping</span>
                  <span className="tabular-nums text-fg-secondary">
                    {nprLabel(order.shippingPaisa)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border px-3 py-2.5 text-sm">
                  <span className="font-semibold text-fg">Total</span>
                  <span className="font-semibold tabular-nums tracking-tight text-fg">
                    {nprLabel(order.totalPaisa)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Delivery */}
          {order.address && (
            <section>
              <SectionLabel icon={MapPin}>Delivery address</SectionLabel>
              <p className="mt-2 rounded-xl border border-border bg-bg px-3 py-2.5 text-sm leading-relaxed text-fg-secondary">
                {order.address}
              </p>
            </section>
          )}

          {/* Notes */}
          {order.notes && (
            <section>
              <SectionLabel icon={StickyNote}>Notes</SectionLabel>
              <p className="mt-2 rounded-xl border border-border bg-bg px-3 py-2.5 text-sm leading-relaxed text-fg-secondary">
                {order.notes}
              </p>
            </section>
          )}

          {/* COD gate */}
          {pendingConfirm && customer && (
            <div className="rounded-xl border border-warning/25 bg-warning-soft/60 p-4">
              <p className="text-sm font-semibold text-fg">Confirm this COD order?</p>
              <p className="mt-1 text-xs text-fg-secondary">
                Review return history before you commit to shipping.
              </p>
              <div className="mt-3">
                <CodRiskPanel customerId={customer._id} />
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setPendingConfirm(null)}>
                  Not now
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  loading={changeStatus.isPending}
                  onClick={() => doChange('confirmed')}
                >
                  Confirm order
                </Button>
              </div>
            </div>
          )}

          {/* Transitions */}
          {!pendingConfirm && allowed.length > 0 && (
            <div className="border-t border-border pt-4">
              <p className="mb-2.5 text-2xs font-semibold uppercase tracking-wider text-fg-muted">
                Move order
              </p>
              <div className="flex flex-wrap gap-2">
                {allowed.map((status) => {
                  const destructive = status === 'cancelled' || status === 'returned';
                  return (
                    <Button
                      key={status}
                      size="sm"
                      variant={destructive ? 'secondary' : 'primary'}
                      loading={changeStatus.isPending}
                      onClick={() => handleTransition(status)}
                      className={cn(destructive && 'text-fg-secondary')}
                    >
                      {nextLabels[status] || status}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          <p className="flex items-center gap-1.5 text-2xs text-fg-muted">
            <Calendar className="h-3 w-3" strokeWidth={1.75} />
            Created {fullDate(order.createdAt)}
          </p>
        </div>
      )}
    </Modal>
  );
}

function SectionLabel({ icon: Icon, children }) {
  return (
    <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-fg-muted">
      {Icon && <Icon className="h-3 w-3" strokeWidth={1.75} />}
      {children}
    </p>
  );
}
