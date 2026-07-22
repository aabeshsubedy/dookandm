import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import {
  ShoppingBag,
  Wallet,
  BellRing,
  TrendingUp,
  ArrowRight,
  Banknote,
  CheckCircle2,
  Package,
  Truck,
  RotateCcw,
  Clock3,
  Inbox,
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
import { format, formatDistanceToNowStrict } from 'date-fns';
import { FEATURES } from '@dokaandm/shared';
import { Page } from '../components/layout/PageHeader.jsx';
import { Card, CardBody } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { UpgradeGate } from '../components/common/UpgradeGate.jsx';
import { LoadingPanel } from '../components/ui/Skeleton.jsx';
import { useDashboardSummary, useDashboardRevenue, useReminders } from '../hooks/data.js';
import { useAuthStore } from '../store/authStore.js';
import { useThemeStore } from '../store/themeStore.js';
import { nprLabel } from '../lib/format.js';
import { cn } from '../lib/cn.js';

const PIPELINE_STAGES = [
  { key: 'pending', label: 'Pending', icon: Clock3 },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Package },
  { key: 'returned', label: 'Returned', icon: RotateCcw },
];

export default function DashboardPage() {
  const seller = useAuthStore((s) => s.seller);
  const firstName = seller?.fullName?.split(' ')[0] || 'there';

  return (
    <Page>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">
            Namaste, {firstName}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            {seller?.businessName
              ? `${seller.businessName} · ${format(new Date(), 'EEEE, MMM d')}`
              : format(new Date(), 'EEEE, MMM d')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/inbox">
            <Button variant="secondary" size="sm">
              <Inbox className="h-3.5 w-3.5" /> Inbox
            </Button>
          </Link>
          <Link to="/orders">
            <Button variant="primary" size="sm">
              <ShoppingBag className="h-3.5 w-3.5" /> Orders
            </Button>
          </Link>
        </div>
      </div>

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
  const plan = useAuthStore((s) => s.plan);
  const isDark = useThemeStore((s) => s.resolved) === 'dark';

  const chartData = useMemo(
    () =>
      (revenue?.series || []).map((d) => ({
        date: d.date,
        value: (d.valuePaisa || 0) / 100,
        valuePaisa: d.valuePaisa || 0,
        count: d.count || 0,
        label: format(new Date(d.date), 'MMM d'),
      })),
    [revenue]
  );

  const stats = useMemo(() => {
    const pipeline = summary?.pipeline || {};
    const series = chartData;

    const totalPipeline = PIPELINE_STAGES.reduce((s, st) => s + (pipeline[st.key] || 0), 0);
    const active = ['pending', 'confirmed', 'shipped'].reduce(
      (s, k) => s + (pipeline[k] || 0),
      0
    );
    const delivered = pipeline.delivered || 0;
    const returned = pipeline.returned || 0;
    const completed = delivered + returned;
    const fulfillmentRate = completed > 0 ? Math.round((delivered / completed) * 100) : null;
    const returnRate = completed > 0 ? Math.round((returned / completed) * 100) : null;

    const rev30 = series.reduce((s, d) => s + d.valuePaisa, 0);
    const orders30 = series.reduce((s, d) => s + d.count, 0);
    const daysWithSales = series.filter((d) => d.valuePaisa > 0).length;
    const avgDaily = rev30 / 30;
    const last7 = series.slice(-7).reduce((s, d) => s + d.valuePaisa, 0);
    const prev7 = series.slice(-14, -7).reduce((s, d) => s + d.valuePaisa, 0);
    const weekDelta =
      prev7 === 0 ? (last7 > 0 ? 100 : 0) : Math.round(((last7 - prev7) / prev7) * 100);

    let peak = series[0];
    series.forEach((d) => {
      if (d.valuePaisa > (peak?.valuePaisa || 0)) peak = d;
    });

    return {
      todayCount: summary?.todayOrders?.count ?? 0,
      todayValue: summary?.todayOrders?.valuePaisa || 0,
      monthRev: summary?.monthRevenuePaisa || 0,
      codPending: summary?.codPending ?? 0,
      followUps: summary?.followUpsDue ?? 0,
      pipeline,
      totalPipeline,
      active,
      delivered,
      fulfillmentRate,
      returnRate,
      rev30,
      orders30,
      daysWithSales,
      avgDaily,
      weekDelta,
      peak,
    };
  }, [chartData, summary]);

  if (isLoading) return <LoadingPanel />;

  const brand = isDark ? '#60a5fa' : '#3b82f6';
  const grid = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const tick = isDark ? '#71717a' : '#a1a1aa';
  const tooltip = {
    borderRadius: 12,
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
    background: isDark ? '#18181b' : '#fff',
    color: isDark ? '#fafafa' : '#18181b',
    fontSize: 12,
    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
    padding: '10px 12px',
  };

  const kpis = [
    {
      label: "Today's orders",
      value: stats.todayCount,
      sub: nprLabel(stats.todayValue),
      icon: ShoppingBag,
      to: '/orders',
    },
    {
      label: 'Month revenue',
      value: nprLabel(stats.monthRev),
      sub: `${stats.delivered} delivered`,
      icon: Banknote,
      to: '/orders?status=delivered',
    },
    {
      label: 'COD to confirm',
      value: stats.codPending,
      sub: stats.codPending ? 'Awaiting review' : 'Nothing pending',
      icon: Wallet,
      to: '/orders?status=pending',
      soft: stats.codPending > 0 ? 'warn' : null,
    },
    {
      label: 'Follow-ups due',
      value: stats.followUps,
      sub: stats.followUps ? 'Overdue' : 'All clear',
      icon: BellRing,
      to: '/reminders',
      soft: stats.followUps > 0 ? 'alert' : null,
    },
  ];

  const pipelineMax = Math.max(1, ...PIPELINE_STAGES.map((s) => stats.pipeline[s.key] || 0));
  const overdue = reminderData?.data || [];

  return (
    <div className="mt-8 space-y-8">
      {/* KPI row — soft, even rhythm */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link
            key={k.label}
            to={k.to}
            className={cn(
              'rounded-2xl border border-border/80 bg-surface p-5 transition-colors duration-200',
              'hover:border-border-strong hover:bg-surface-2/40'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-surface-2 text-fg-secondary">
                <k.icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <p className="text-sm text-fg-muted">{k.label}</p>
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-fg tabular-nums">
              {k.value}
            </p>
            <p
              className={cn(
                'mt-1 text-sm text-fg-muted',
                k.soft === 'warn' && 'text-warning',
                k.soft === 'alert' && 'text-danger'
              )}
            >
              {k.sub}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Revenue */}
        <section className="rounded-2xl border border-border/80 bg-surface p-5 sm:p-6 lg:col-span-3">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-fg">Revenue</h2>
              <p className="mt-0.5 text-sm text-fg-muted">Last 30 days · delivered orders</p>
            </div>
            <div className="flex flex-wrap gap-6">
              <InlineStat label="30-day total" value={nprLabel(stats.rev30)} />
              <InlineStat
                label="vs prior week"
                value={`${stats.weekDelta > 0 ? '+' : ''}${stats.weekDelta}%`}
                muted
              />
              <InlineStat label="Orders" value={stats.orders30} muted />
            </div>
          </div>

          {chartData.every((d) => d.value === 0) ? (
            <div className="flex h-56 flex-col items-center justify-center text-fg-muted">
              <TrendingUp className="h-7 w-7 opacity-30" strokeWidth={1.5} />
              <p className="mt-3 text-sm text-fg-secondary">No delivered revenue yet</p>
              <p className="mt-1 text-xs text-fg-muted">
                Numbers will appear as orders are marked delivered.
              </p>
            </div>
          ) : (
            <>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ left: 0, right: 4, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="softRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={brand} stopOpacity={0.12} />
                        <stop offset="100%" stopColor={brand} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 8" stroke={grid} vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: tick }}
                      interval={4}
                      axisLine={false}
                      tickLine={false}
                      dy={8}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: tick }}
                      axisLine={false}
                      tickLine={false}
                      width={44}
                      tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                    />
                    <Tooltip
                      contentStyle={tooltip}
                      cursor={{ stroke: brand, strokeOpacity: 0.25, strokeWidth: 1 }}
                      formatter={(_v, _n, item) => [
                        nprLabel(item.payload.valuePaisa),
                        `${item.payload.count} order${item.payload.count === 1 ? '' : 's'}`,
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={brand}
                      strokeWidth={2}
                      fill="url(#softRev)"
                      dot={false}
                      activeDot={{ r: 4, fill: brand, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border/70 pt-5 sm:grid-cols-4">
                <FootStat label="Avg / day" value={nprLabel(Math.round(stats.avgDaily))} />
                <FootStat label="Active days" value={`${stats.daysWithSales} of 30`} />
                <FootStat
                  label="Peak day"
                  value={
                    stats.peak?.valuePaisa
                      ? format(new Date(stats.peak.date), 'MMM d')
                      : '—'
                  }
                />
                <FootStat
                  label="Peak value"
                  value={stats.peak?.valuePaisa ? nprLabel(stats.peak.valuePaisa) : '—'}
                />
              </div>
            </>
          )}
        </section>

        {/* Pipeline */}
        <section className="rounded-2xl border border-border/80 bg-surface p-5 sm:p-6 lg:col-span-2">
          <div className="mb-5 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-fg">Pipeline</h2>
              <p className="mt-0.5 text-sm text-fg-muted">
                {stats.active} active · {stats.totalPipeline} total
              </p>
            </div>
            <Link
              to="/orders"
              className="text-sm text-fg-muted transition-colors hover:text-fg"
            >
              View all
            </Link>
          </div>

          <div className="space-y-4">
            {PIPELINE_STAGES.map((s) => {
              const count = stats.pipeline[s.key] || 0;
              const pct = Math.round((count / pipelineMax) * 100);
              return (
                <div key={s.key}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-fg-secondary">
                      <s.icon className="h-3.5 w-3.5 text-fg-muted" strokeWidth={1.75} />
                      {s.label}
                    </span>
                    <span className="font-medium tabular-nums text-fg">{count}</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-brand/70 transition-all duration-500 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border/70 pt-5">
            <div>
              <p className="text-xs text-fg-muted">Fulfillment</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-fg">
                {stats.fulfillmentRate == null ? '—' : `${stats.fulfillmentRate}%`}
              </p>
            </div>
            <div>
              <p className="text-xs text-fg-muted">Return rate</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-fg">
                {stats.returnRate == null ? '—' : `${stats.returnRate}%`}
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Follow-ups */}
        <section className="rounded-2xl border border-border/80 bg-surface p-5 sm:p-6 lg:col-span-3">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-fg">Follow-ups</h2>
              <p className="mt-0.5 text-sm text-fg-muted">
                {overdue.length === 0
                  ? 'Nothing overdue'
                  : `${overdue.length} overdue reminder${overdue.length === 1 ? '' : 's'}`}
              </p>
            </div>
            <Link
              to="/reminders"
              className="inline-flex items-center gap-1 text-sm text-fg-muted transition-colors hover:text-fg"
            >
              Reminders <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {overdue.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl bg-surface-2/60 px-4 py-6">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-surface text-fg-muted">
                <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-medium text-fg">You&apos;re all caught up</p>
                <p className="text-sm text-fg-muted">No overdue follow-ups right now.</p>
              </div>
            </div>
          ) : (
            <ul className="space-y-1">
              {overdue.slice(0, 5).map((r) => (
                <li
                  key={r._id}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-2/50"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-fg-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{r.title}</p>
                    <p className="text-xs text-fg-muted">
                      {r.dueAt
                        ? formatDistanceToNowStrict(new Date(r.dueAt), { addSuffix: true })
                        : '—'}
                      {r.customer?.name ? ` · ${r.customer.name}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Usage + links */}
        <section className="rounded-2xl border border-border/80 bg-surface p-5 sm:p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-fg">Workspace</h2>
              <p className="mt-0.5 text-sm capitalize text-fg-muted">
                {plan?.label || 'Free'} plan
              </p>
            </div>
            <Link
              to="/settings/plan"
              className="text-sm text-fg-muted transition-colors hover:text-fg"
            >
              Manage
            </Link>
          </div>

          <div className="space-y-5">
            <UsageRow
              label="Orders this month"
              used={plan?.usage?.ordersThisPeriod ?? 0}
              limit={plan?.limits?.ordersPerMonth}
            />
            <UsageRow
              label="Customers"
              used={plan?.usage?.customers ?? 0}
              limit={plan?.limits?.customers}
            />
            <UsageRow
              label="Channels"
              used={plan?.usage?.channels ?? 0}
              limit={plan?.limits?.channels}
            />
          </div>

          <div className="mt-6 space-y-0.5 border-t border-border/70 pt-4">
            {[
              { to: '/inbox', label: 'Inbox', icon: Inbox },
              { to: '/orders', label: 'Orders', icon: ShoppingBag },
              { to: '/customers', label: 'Customers', icon: Package },
              { to: '/reminders', label: 'Reminders', icon: BellRing },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-fg-secondary transition-colors hover:bg-surface-2/70 hover:text-fg"
              >
                <l.icon className="h-3.5 w-3.5 text-fg-muted" strokeWidth={1.75} />
                {l.label}
                <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function InlineStat({ label, value, muted }) {
  return (
    <div className="text-right">
      <p className="text-xs text-fg-muted">{label}</p>
      <p
        className={cn(
          'mt-0.5 text-sm font-semibold tabular-nums',
          muted ? 'text-fg-secondary' : 'text-fg'
        )}
      >
        {value}
      </p>
    </div>
  );
}

function FootStat({ label, value }) {
  return (
    <div>
      <p className="text-xs text-fg-muted">{label}</p>
      <p className="mt-0.5 text-sm font-medium tabular-nums text-fg">{value}</p>
    </div>
  );
}

function UsageRow({ label, used, limit }) {
  const unlimited = limit == null;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-fg-muted">{label}</span>
        <span className="tabular-nums text-fg-secondary">
          {used}
          <span className="text-fg-muted">{unlimited ? ' / ∞' : ` / ${limit}`}</span>
        </span>
      </div>
      {!unlimited && (
        <div className="h-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-brand/60 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
