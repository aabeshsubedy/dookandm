import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ORDER_STATUS_TRANSITIONS } from '@dokaandm/shared';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { OrderStatusBadge, PaymentBadge } from '../../components/common/StatusBadge.jsx';
import { RiskBadge } from '../../components/common/RiskBadge.jsx';
import { Avatar } from '../../components/common/Avatar.jsx';
import { CodRiskPanel } from './CodRiskPanel.jsx';
import { nprLabel, fullDate } from '../../lib/format.js';
import { useOrder, useChangeOrderStatus } from '../../hooks/data.js';
import { apiError } from '../../lib/api.js';
import { toast } from '../../store/toastStore.js';

const nextLabels = {
  confirmed: 'Confirm',
  shipped: 'Mark shipped',
  delivered: 'Mark delivered',
  returned: 'Mark returned',
  cancelled: 'Cancel',
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

  return (
    <Modal open={open} onClose={onClose} title={order ? `Order ${order.orderNumber}` : 'Order'} size="md">
      {isLoading || !order ? (
        <div className="py-10 text-center text-fg-muted">Loading…</div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <OrderStatusBadge status={order.status} />
            <PaymentBadge type={order.paymentType} />
          </div>

          {customer && (
            <Link
              to={`/customers/${customer._id}`}
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-surface-2"
            >
              <Avatar name={customer.name || order.phone} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-fg">{customer.name || 'Unknown'}</p>
                <p className="text-sm text-fg-muted">{order.phone}</p>
              </div>
              {customer.riskCache?.label && <RiskBadge label={customer.riskCache.label} />}
            </Link>
          )}

          <div className="rounded-lg border border-border">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {order.items.map((it, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-fg">{it.productName}</td>
                    <td className="px-3 py-2 text-center text-fg-muted">×{it.qty}</td>
                    <td className="px-3 py-2 text-right text-fg">
                      {nprLabel(it.unitPricePaisa * it.qty)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between border-t border-border px-3 py-2 text-sm">
              <span className="text-fg-muted">Shipping</span>
              <span className="text-fg-secondary">{nprLabel(order.shippingPaisa)}</span>
            </div>
            <div className="flex justify-between border-t border-border bg-surface-2/50 px-3 py-2 font-semibold text-fg">
              <span>Total</span>
              <span>{nprLabel(order.totalPaisa)}</span>
            </div>
          </div>

          {order.address && (
            <div>
              <p className="text-2xs font-medium uppercase tracking-wider text-fg-muted">Delivery</p>
              <p className="mt-0.5 text-sm text-fg-secondary">{order.address}</p>
            </div>
          )}

          {pendingConfirm && customer && (
            <div className="rounded-lg border border-warning/30 bg-warning-soft p-4">
              <p className="mb-2 text-sm font-medium text-fg">Confirm this COD order?</p>
              <CodRiskPanel customerId={customer._id} />
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

          {!pendingConfirm && allowed.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              {allowed.map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={status === 'cancelled' || status === 'returned' ? 'secondary' : 'primary'}
                  loading={changeStatus.isPending}
                  onClick={() => handleTransition(status)}
                >
                  {nextLabels[status] || status}
                </Button>
              ))}
            </div>
          )}

          <p className="text-xs text-fg-muted">Created {fullDate(order.createdAt)}</p>
        </div>
      )}
    </Modal>
  );
}
