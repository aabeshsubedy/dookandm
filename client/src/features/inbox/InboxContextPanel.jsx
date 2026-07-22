import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  User,
  ExternalLink,
  Phone,
  Plus,
  Package,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { Avatar } from '../../components/common/Avatar.jsx';
import { RiskBadge } from '../../components/common/RiskBadge.jsx';
import { ChannelBadge } from '../../components/common/ChannelBadge.jsx';
import { OrderStatusBadge } from '../../components/common/StatusBadge.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { nprLabel } from '../../lib/format.js';
import { cn } from '../../lib/cn.js';

export function InboxContextPanel({ conversation, orders = [], onCreateOrder }) {
  const customer = conversation?.customer;
  const name = customer?.name || conversation?.participantHandle || 'Unknown';
  const risk = customer?.riskCache;
  const stats = customer?.stats;
  const phone = customer?.phones?.[0];

  return (
    <aside className="hidden h-full w-80 shrink-0 flex-col overflow-y-auto border-l border-border bg-surface xl:flex">
      {/* Customer hero */}
      <div className="border-b border-border px-5 py-5">
        <div className="flex items-start gap-3">
          <Avatar name={name} size="lg" className="ring-2 ring-border" />
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="truncate text-sm font-semibold tracking-tight text-fg">{name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <ChannelBadge type={conversation.channelType} size="sm" withLabel />
              {risk?.label && <RiskBadge label={risk.label} />}
            </div>
            {phone && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-fg-secondary">
                <Phone className="h-3.5 w-3.5 shrink-0 text-fg-muted" strokeWidth={1.75} />
                <span className="truncate">{phone}</span>
              </p>
            )}
            {!phone && conversation?.participantHandle && (
              <p className="mt-2 truncate text-xs text-fg-muted">
                @{conversation.participantHandle}
              </p>
            )}
          </div>
        </div>

        {customer && (
          <Link
            to={`/customers/${customer._id}`}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-bg px-3 py-2 text-xs font-medium text-fg-secondary transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <User className="h-3.5 w-3.5" strokeWidth={1.75} />
            View full profile
            <ExternalLink className="h-3 w-3 opacity-60" />
          </Link>
        )}
      </div>

      {/* Stats strip */}
      {(stats || risk) && (
        <div className="grid grid-cols-3 gap-px border-b border-border bg-border">
          <StatCell
            icon={Package}
            label="Orders"
            value={stats?.totalOrders != null ? String(stats.totalOrders) : '—'}
          />
          <StatCell
            icon={TrendingUp}
            label="Total spent"
            value={
              stats?.lifetimeValuePaisa != null
                ? nprLabel(stats.lifetimeValuePaisa).replace('NPR ', '')
                : '—'
            }
          />
          <StatCell
            icon={ShieldCheck}
            label="Returns"
            value={
              risk?.returnedOrders != null
                ? `${risk.returnedOrders}${risk.totalCompleted ? `/${risk.totalCompleted}` : ''}`
                : '—'
            }
          />
        </div>
      )}

      {/* Tags */}
      {customer?.tags?.length > 0 && (
        <div className="border-b border-border px-5 py-4">
          <SectionLabel>Tags</SectionLabel>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {customer.tags.map((t) => (
              <Badge key={t} tone="ocean">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Risk detail when meaningful */}
      {risk?.label && risk.label !== 'new' && (
        <div className="border-b border-border px-5 py-4">
          <SectionLabel>COD risk</SectionLabel>
          <div
            className={cn(
              'mt-2 rounded-xl border px-3 py-3',
              risk.label === 'risky' && 'border-danger/25 bg-danger-soft/50',
              risk.label === 'medium' && 'border-warning/25 bg-warning-soft/50',
              risk.label === 'reliable' && 'border-success/25 bg-success-soft/50'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <RiskBadge label={risk.label} size="md" />
              {risk.returnRate != null && (
                <span className="text-xs font-medium tabular-nums text-fg-secondary">
                  {Math.round(risk.returnRate * 100)}% return
                </span>
              )}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-fg-secondary">
              Based on {risk.deliveredOrders ?? 0} delivered and {risk.returnedOrders ?? 0} returned
              orders from your history.
            </p>
          </div>
        </div>
      )}

      {/* Orders */}
      <div className="flex min-h-0 flex-1 flex-col px-5 py-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <SectionLabel>Orders from chat</SectionLabel>
          <button
            type="button"
            onClick={onCreateOrder}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-2xs font-medium text-brand transition-colors hover:bg-brand-soft"
          >
            <Plus className="h-3 w-3" strokeWidth={2.5} />
            New
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-bg px-4 py-8 text-center">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-surface-2 text-fg-muted">
              <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <p className="text-xs font-medium text-fg">No orders yet</p>
            <p className="mt-1 text-2xs leading-relaxed text-fg-muted">
              Capture an order from this conversation in a few taps.
            </p>
            <Button variant="primary" size="sm" className="mt-4" onClick={onCreateOrder}>
              <ShoppingBag className="h-3.5 w-3.5" />
              Create order
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {orders.map((o) => (
              <li key={o._id}>
                <Link
                  to="/orders"
                  className="block rounded-xl border border-border bg-bg px-3 py-2.5 transition-colors hover:border-border-strong hover:bg-surface-2/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold tabular-nums text-fg">
                      {o.orderNumber}
                    </span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="text-xs font-medium tabular-nums text-fg-secondary">
                      {nprLabel(o.totalPaisa)}
                    </span>
                    {o.paymentType === 'cod' && (
                      <span className="text-2xs font-medium uppercase tracking-wide text-warning">
                        COD
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Sticky footer action when orders exist */}
      {orders.length > 0 && (
        <div className="shrink-0 border-t border-border p-4">
          <Button variant="primary" size="md" className="w-full" onClick={onCreateOrder}>
            <ShoppingBag className="h-4 w-4" />
            Create order
          </Button>
        </div>
      )}
    </aside>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-2xs font-semibold uppercase tracking-wider text-fg-muted">{children}</p>
  );
}

function StatCell({ icon: Icon, label, value }) {
  return (
    <div className="bg-surface px-2 py-3 text-center">
      <Icon className="mx-auto mb-1 h-3.5 w-3.5 text-fg-muted" strokeWidth={1.75} />
      <p className="truncate text-sm font-semibold tabular-nums tracking-tight text-fg">{value}</p>
      <p className="text-2xs text-fg-muted">{label}</p>
    </div>
  );
}
