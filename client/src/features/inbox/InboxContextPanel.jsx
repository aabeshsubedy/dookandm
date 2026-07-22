import { Link } from 'react-router-dom';
import { ShoppingBag, User, ExternalLink, Phone } from 'lucide-react';
import { Avatar } from '../../components/common/Avatar.jsx';
import { RiskBadge } from '../../components/common/RiskBadge.jsx';
import { OrderStatusBadge } from '../../components/common/StatusBadge.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { nprLabel } from '../../lib/format.js';

export function InboxContextPanel({ conversation, orders = [], onCreateOrder }) {
  const customer = conversation?.customer;
  const name = customer?.name || conversation?.participantHandle || 'Unknown';
  const risk = customer?.riskCache?.label;

  return (
    <div className="hidden h-full w-72 shrink-0 flex-col overflow-y-auto border-l border-border bg-surface xl:flex">
      <div className="flex flex-col items-center border-b border-border px-4 py-6 text-center">
        <Avatar name={name} size="lg" />
        <p className="mt-3 text-sm font-semibold text-fg">{name}</p>
        {customer?.phones?.[0] && (
          <p className="mt-0.5 flex items-center gap-1 text-sm text-fg-muted">
            <Phone className="h-3.5 w-3.5" /> {customer.phones[0]}
          </p>
        )}
        {risk && (
          <div className="mt-3">
            <RiskBadge label={risk} size="md" />
          </div>
        )}
        {customer && (
          <Link
            to={`/customers/${customer._id}`}
            className="link-accent mt-3 inline-flex items-center gap-1 text-sm"
          >
            <User className="h-3.5 w-3.5" /> View profile
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>

      {customer?.tags?.length > 0 && (
        <div className="border-b border-border px-4 py-3">
          <p className="mb-1.5 text-2xs font-medium uppercase tracking-wider text-fg-muted">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {customer.tags.map((t) => (
              <Badge key={t} tone="ocean">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-2xs font-medium uppercase tracking-wider text-fg-muted">Orders</p>
          <Button variant="ghost" size="sm" onClick={onCreateOrder}>
            <ShoppingBag className="h-3.5 w-3.5" /> New
          </Button>
        </div>
        {orders.length === 0 ? (
          <p className="rounded-lg bg-surface-2 px-3 py-4 text-center text-xs text-fg-muted">
            No orders from this chat yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {orders.map((o) => (
              <li key={o._id}>
                <Link
                  to="/orders"
                  className="block rounded-lg border border-border px-3 py-2 transition-colors hover:bg-surface-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-fg">{o.orderNumber}</span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-fg-muted">{nprLabel(o.totalPaisa)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
