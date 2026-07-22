import { PAYMENT_TYPE_LABELS } from '@dokaandm/shared';
import { Badge } from '../ui/Badge.jsx';

const orderTone = {
  pending: 'warn',
  confirmed: 'ocean',
  shipped: 'teal',
  delivered: 'good',
  returned: 'bad',
  cancelled: 'neutral',
};

const orderLabel = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  returned: 'Returned',
  cancelled: 'Cancelled',
};

export function OrderStatusBadge({ status }) {
  return (
    <Badge tone={orderTone[status] || 'neutral'} dot>
      {orderLabel[status] || status}
    </Badge>
  );
}

export function PaymentBadge({ type }) {
  const isCod = type === 'cod';
  return (
    <Badge tone={isCod ? 'warn' : 'cyan'}>{PAYMENT_TYPE_LABELS[type] || type}</Badge>
  );
}
