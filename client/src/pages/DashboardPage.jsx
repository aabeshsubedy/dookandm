import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Wallet,
  BellRing,
  TrendingUp,
  ArrowRight,
  Banknote,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { FEATURES } from '@dokaandm/shared';
import { Page, PageHeader } from '../components/layout/PageHeader.jsx';
import { Card, CardBody } from '../components/ui/Card.jsx';
import { UpgradeGate } from '../components/common/UpgradeGate.jsx';
import { LoadingPanel } from '../components/ui/Skeleton.jsx';
import { OrderStatusBadge } from '../components/common/StatusBadge.jsx';
import { useDashboardSummary, useDashboardRevenue, useReminders } from '../hooks/data.js';
import { useAuthStore } from '../store/authStore.js';
import { useThemeStore } from '../store/themeStore.js';
import { nprLabel } from '../lib/format.js';
import { format } from 'date-fns';

export default function DashboardPage() {
  const seller = useAuthStore((s) => s.seller);
  return (
    <Page>
      <PageHeader
        title={`Namaste, ${seller?.fullName?.split(' ')[0] || 'there'}`}
        description="Overview of your shop today."
      />
      <UpgradeGate
        feature={FEATURES.DASHBOARD}
        title="Unlock your business dashboard"
        description="See today's orders, revenue, and follow-ups at a glance."
      >
        <DashboardContent />
      </UpgradeGate>
    </Page>
  );
}

function DashboardContent() {
  const { data: summary, isLoading } = useDashboardSummary();
  const { data: revenue } = useDashboardRevenue();
  const { data: reminderData } = useReminders({ due: 'overdue' });
  const isDark = useThemeStore((s) => s.resolved) === 'dark';

  if (isLoading) return <LoadingPanel />;

  const cards = [
    {
      label: "Today's orders",
      value: summary?.todayOrders?.count ?? 0,
      sub: nprLabel(summary?.todayOrders?.valuePaisa || 0),
      icon: ShoppingBag,
      to: '/orders',
    },
    {
      label: 'COD to confirm',
      value: summary?.codPending ?? 0,
      sub: 'Pending confirmation',
      icon: Wallet,
      to: '/orders?status=pending',
    },
    {
      label: 'Follow-ups due',
      value: summary?.followUpsDue ?? 0,
      sub: 'Reminders',
      icon: BellRing,
      to: '/reminders',
    },
    {
      label: 'Revenue this month',
      value: nprLabel(summary?.monthRevenuePaisa || 0),
      sub: 'Delivered orders',
      icon: Banknote,
      to: '/orders?status=delivered',
      big: true,
    },
  ];

  const chartData = (revenue?.series || []).map((d) => ({
    date: d.date,
    value: d.valuePaisa / 100,
    label: format(new Date(d.date), 'MMM d'),
  }));

  const gridStroke = isDark ? '#27272a' : '#e4e4e7';
  const tickFill = isDark ? '#71717a' : '#a1a1aa';
  const brandStroke = isDark ? '#3b82f6' : '#2563eb';
  const tooltipStyle = {
    borderRadius: 8,
    border: isDark ? '1px solid #3f3f46' : '1px solid #e4e4e7',
    background: isDark ? '#18181b' : '#ffffff',
    color: isDark ? '#fafafa' : '#18181b',
    fontSize: 12,
    boxShadow: 'none',
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="card p-4 transition-colors hover:border-border-strong hover:bg-surface-2/40"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <c.icon className="h-4 w-4" />
            </div>
            <p className={`mt-3 font-semibold tracking-tight text-fg ${c.big ? 'text-lg' : 'text-2xl'}`}>
              {c.value}
            </p>
            <p className="mt-0.5 text-xs text-fg-muted">{c.label}</p>
            <p className="mt-0.5 text-2xs text-fg-muted">{c.sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-fg">
              <TrendingUp className="h-4 w-4 text-fg-muted" /> Revenue · last 30 days
            </h3>
            {chartData.every((d) => d.value === 0) ? (
              <div className="flex h-52 flex-col items-center justify-center text-fg-muted">
                <TrendingUp className="h-7 w-7 opacity-40" />
                <p className="mt-2 text-sm">No delivered revenue yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={208}>
                <AreaChart data={chartData} margin={{ left: -18, right: 6, top: 6 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={brandStroke} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={brandStroke} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: tickFill }}
                    interval={5}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: tickFill }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                  />
                  <Tooltip
                    formatter={(v) => [nprLabel(v * 100), 'Revenue']}
                    contentStyle={tooltipStyle}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={brandStroke}
                    strokeWidth={2}
                    fill="url(#rev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardBody>
              <h3 className="mb-3 text-sm font-semibold text-fg">Pipeline</h3>
              <div className="space-y-2">
                {['pending', 'confirmed', 'shipped', 'delivered', 'returned'].map((s) => (
                  <div key={s} className="flex items-center justify-between">
                    <OrderStatusBadge status={s} />
                    <span className="text-sm font-medium tabular-nums text-fg">
                      {summary?.pipeline?.[s] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-fg">Overdue follow-ups</h3>
                <Link to="/reminders" className="link-accent text-xs">
                  View all <ArrowRight className="inline h-3 w-3" />
                </Link>
              </div>
              {(reminderData?.data || []).length === 0 ? (
                <p className="text-sm text-fg-muted">Nothing overdue.</p>
              ) : (
                <ul className="space-y-2">
                  {reminderData.data.slice(0, 4).map((r) => (
                    <li
                      key={r._id}
                      className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-fg"
                    >
                      {r.title}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
