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
  Users,
  Sparkles,
  ChevronRight,
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
import { Button } from '../components/ui/Button.jsx';
import { UpgradeGate } from '../components/common/UpgradeGate.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useDashboardSummary, useDashboardRevenue, useReminders } from '../hooks/data.js';
import { useAuthStore } from '../store/authStore.js';
import { useThemeStore } from '../store/themeStore.js';
import { nprLabel } from '../lib/format.js';
import { cn } from '../lib/cn.js';

const PIPELINE_STAGES = [
  { key: 'pending', label: 'Pending', icon: Clock3, tone: 'warn' },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2, tone: 'brand' },
  { key: 'shipped', label: 'Shipped', icon: Truck, tone: 'neutral' },
  { key: 'delivered', label: 'Delivered', icon: Package, tone: 'good' },
  { key: 'returned', label: 'Returned', icon: RotateCcw, tone: 'bad' },
];

const QUICK_LINKS = [
  { to: '/inbox', label: 'Inbox', description: 'Reply to DMs', icon: Inbox },
  { to: '/orders', label: 'Orders', description: 'Pipeline & list', icon: ShoppingBag },
  { to: '/customers', label: 'Customers', description: 'CRM & risk', icon: Users },
  { to: '/reminders', label: 'Reminders', description: 'Follow-ups', icon: BellRing },
];

export default function DashboardPage() {
  const seller = useAuthStore((s) => s.seller);
  const firstName = seller?.fullName?.split(' ')[0] || 'there';
  const today = format(new Date(), 'EEEE, MMM d');

  return (
    <Page>
      {/* Page header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-fg-muted">{today}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-fg">
            Namaste, {firstName}
          </h1>
          {seller?.businessName && (
            <p className="mt-1 truncate text-sm text-fg-secondary">{seller.businessName}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link to="/inbox">
            <Button variant="secondary" size="sm">
              <Inbox className="h-3.5 w-3.5" strokeWidth={1.75} />
              Inbox
            </Button>
          </Link>
          <Link to="/orders">
            <Button variant="primary" size="sm">
              <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.75} />
              Orders
            </Button>
          </Link>
        </div>
      </header>

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
      last7,
      peak,
    };
  }, [chartData, summary]);

  if (isLoading) return <DashboardSkeleton />;

  // Soft chart palette — brand blue, never neon
  const brand = isDark ? 'rgb(96, 165, 250)' : 'rgb(37, 99, 235)';
  const grid = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const tick = isDark ? '#71717a' : '#a1a1aa';
  const tooltip = {
    borderRadius: 10,
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
    background: isDark ? '#18181b' : '#ffffff',
    color: isDark ? '#fafafa' : '#18181b',
    fontSize: 12,
    boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.06)',
    padding: '10px 12px',
  };

  const kpis = [
    {
      label: "Today's orders",
      value: stats.todayCount,
      sub: nprLabel(stats.todayValue),
      hint: 'Value today',
      icon: ShoppingBag,
      to: '/orders',
      accent: 'brand',
    },
    {
      label: 'Month revenue',
      value: nprLabel(stats.monthRev),
      sub: `${stats.delivered} delivered`,
      hint: 'Delivered this month',
      icon: Banknote,
      to: '/orders?status=delivered',
      accent: 'brand',
    },
    {
      label: 'COD to confirm',
      value: stats.codPending,
      sub: stats.codPending ? 'Needs your review' : 'Queue is clear',
      hint: 'Pending COD',
      icon: Wallet,
      to: '/orders?status=pending',
      accent: stats.codPending > 0 ? 'warn' : 'neutral',
    },
    {
      label: 'Follow-ups due',
      value: stats.followUps,
      sub: stats.followUps ? 'Overdue items' : 'All caught up',
      hint: 'Reminders',
      icon: BellRing,
      to: '/reminders',
      accent: stats.followUps > 0 ? 'alert' : 'neutral',
    },
  ];

  const pipelineMax = Math.max(1, ...PIPELINE_STAGES.map((s) => stats.pipeline[s.key] || 0));
  const overdue = reminderData?.data || [];
  const chartEmpty = chartData.every((d) => d.value === 0);

  return (
    <div className="mt-8 space-y-6">
      {/* KPI strip */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </section>

      {/* Revenue + Pipeline */}
      <div className="grid gap-4 lg:grid-cols-5 lg:gap-5">
        <section className="dash-panel lg:col-span-3">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/70 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-fg">Revenue</h2>
              <p className="mt-0.5 text-xs text-fg-muted">Last 30 days · delivered orders only</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Chip>
                <span className="text-fg-muted">30d</span>
                <span className="font-semibold tabular-nums text-fg">{nprLabel(stats.rev30)}</span>
              </Chip>
              <Chip>
                <span className="text-fg-muted">WoW</span>
                <span
                  className={cn(
                    'font-semibold tabular-nums',
                    stats.weekDelta > 0 && 'text-success',
                    stats.weekDelta < 0 && 'text-danger',
                    stats.weekDelta === 0 && 'text-fg'
                  )}
                >
                  {stats.weekDelta > 0 ? '+' : ''}
                  {stats.weekDelta}%
                </span>
              </Chip>
              <Chip>
                <span className="text-fg-muted">Orders</span>
                <span className="font-semibold tabular-nums text-fg">{stats.orders30}</span>
              </Chip>
            </div>
          </div>

          <div className="px-3 pb-2 pt-4 sm:px-4">
            {chartEmpty ? (
              <div className="flex h-56 flex-col items-center justify-center px-4 text-center">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-surface-2 text-fg-muted">
                  <TrendingUp className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <p className="mt-3 text-sm font-medium text-fg">No delivered revenue yet</p>
                <p className="mt-1 max-w-xs text-xs leading-relaxed text-fg-muted">
                  The chart fills in as you mark orders delivered. Capture an order from the inbox to
                  get started.
                </p>
                <Link to="/orders" className="mt-4">
                  <Button variant="secondary" size="sm">
                    Go to orders
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="h-56 w-full sm:h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dashRevFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={brand} stopOpacity={isDark ? 0.18 : 0.14} />
                        <stop offset="100%" stopColor={brand} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 10" stroke={grid} vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: tick }}
                      interval={4}
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: tick }}
                      axisLine={false}
                      tickLine={false}
                      width={42}
                      tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                    />
                    <Tooltip
                      contentStyle={tooltip}
                      cursor={{ stroke: brand, strokeOpacity: 0.2, strokeWidth: 1 }}
                      labelStyle={{ color: isDark ? '#a1a1aa' : '#71717a', marginBottom: 4 }}
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
                      fill="url(#dashRevFill)"
                      dot={false}
                      activeDot={{
                        r: 4,
                        fill: brand,
                        stroke: isDark ? '#18181b' : '#fff',
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {!chartEmpty && (
            <div className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
              <FootCell label="Avg / day" value={nprLabel(Math.round(stats.avgDaily))} />
              <FootCell label="Active days" value={`${stats.daysWithSales} / 30`} />
              <FootCell
                label="Peak day"
                value={stats.peak?.valuePaisa ? format(new Date(stats.peak.date), 'MMM d') : '—'}
              />
              <FootCell
                label="Peak value"
                value={stats.peak?.valuePaisa ? nprLabel(stats.peak.valuePaisa) : '—'}
              />
            </div>
          )}
        </section>

        {/* Pipeline */}
        <section className="dash-panel flex flex-col lg:col-span-2">
          <div className="flex items-start justify-between gap-2 border-b border-border/70 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-fg">Pipeline</h2>
              <p className="mt-0.5 text-xs text-fg-muted">
                <span className="font-medium tabular-nums text-fg-secondary">{stats.active}</span>{' '}
                active
                <span className="mx-1.5 text-border-strong">·</span>
                <span className="tabular-nums">{stats.totalPipeline}</span> total
              </p>
            </div>
            <Link
              to="/orders"
              className="inline-flex items-center gap-0.5 text-xs font-medium text-fg-muted transition-colors hover:text-brand"
            >
              View all
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex-1 space-y-4 px-5 py-5 sm:px-6">
            {PIPELINE_STAGES.map((s) => {
              const count = stats.pipeline[s.key] || 0;
              const pct = Math.round((count / pipelineMax) * 100);
              return (
                <div key={s.key}>
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2 text-fg-secondary">
                      <span
                        className={cn(
                          'grid h-6 w-6 place-items-center rounded-md',
                          stageIconBg(s.tone)
                        )}
                      >
                        <s.icon className={cn('h-3.5 w-3.5', stageIconColor(s.tone))} strokeWidth={1.75} />
                      </span>
                      {s.label}
                    </span>
                    <span className="font-semibold tabular-nums text-fg">{count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500 ease-out',
                        stageBarColor(s.tone)
                      )}
                      style={{ width: `${count === 0 ? 0 : Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-auto grid grid-cols-2 gap-px border-t border-border bg-border">
            <div className="bg-surface px-5 py-4">
              <p className="text-2xs font-medium uppercase tracking-wider text-fg-muted">
                Fulfillment
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-fg">
                {stats.fulfillmentRate == null ? '—' : `${stats.fulfillmentRate}%`}
              </p>
              <p className="mt-0.5 text-2xs text-fg-muted">Delivered ÷ completed</p>
            </div>
            <div className="bg-surface px-5 py-4">
              <p className="text-2xs font-medium uppercase tracking-wider text-fg-muted">
                Return rate
              </p>
              <p
                className={cn(
                  'mt-1 text-xl font-semibold tabular-nums tracking-tight',
                  stats.returnRate != null && stats.returnRate > 20
                    ? 'text-warning'
                    : 'text-fg'
                )}
              >
                {stats.returnRate == null ? '—' : `${stats.returnRate}%`}
              </p>
              <p className="mt-0.5 text-2xs text-fg-muted">Returned ÷ completed</p>
            </div>
          </div>
        </section>
      </div>

      {/* Follow-ups + Workspace */}
      <div className="grid gap-4 lg:grid-cols-5 lg:gap-5">
        <section className="dash-panel lg:col-span-3">
          <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-fg">Follow-ups</h2>
              <p className="mt-0.5 text-xs text-fg-muted">
                {overdue.length === 0
                  ? 'Nothing overdue right now'
                  : `${overdue.length} overdue reminder${overdue.length === 1 ? '' : 's'}`}
              </p>
            </div>
            <Link
              to="/reminders"
              className="inline-flex items-center gap-1 text-xs font-medium text-fg-muted transition-colors hover:text-brand"
            >
              All reminders
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="px-3 py-3 sm:px-4">
            {overdue.length === 0 ? (
              <div className="flex items-center gap-3.5 rounded-xl bg-surface-2/50 px-4 py-5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-success-soft text-success">
                  <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-medium text-fg">You&apos;re all caught up</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">
                    No overdue follow-ups. New reminders will show here when due.
                  </p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-border/70">
                {overdue.slice(0, 6).map((r) => (
                  <li key={r._id}>
                    <Link
                      to="/reminders"
                      className="flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-surface-2/60"
                    >
                      <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-warning/80 ring-4 ring-warning/10" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-fg">{r.title}</p>
                        <p className="mt-0.5 truncate text-xs text-fg-muted">
                          <span className="text-warning">
                            {r.dueAt
                              ? formatDistanceToNowStrict(new Date(r.dueAt), { addSuffix: true })
                              : 'No date'}
                          </span>
                          {r.customer?.name ? (
                            <span className="text-fg-muted"> · {r.customer.name}</span>
                          ) : null}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-fg-muted opacity-40" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="dash-panel flex flex-col lg:col-span-2">
          <div className="flex items-center justify-between gap-2 border-b border-border/70 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-brand">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-fg">Workspace</h2>
                <p className="text-xs capitalize text-fg-muted">{plan?.label || 'Free'} plan</p>
              </div>
            </div>
            <Link
              to="/settings/plan"
              className="text-xs font-medium text-fg-muted transition-colors hover:text-brand"
            >
              Manage
            </Link>
          </div>

          <div className="space-y-4 px-5 py-5 sm:px-6">
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
              label="Products"
              used={plan?.usage?.products ?? 0}
              limit={plan?.limits?.products}
            />
            <UsageRow
              label="Channels"
              used={plan?.usage?.channels ?? 0}
              limit={plan?.limits?.channels}
            />
          </div>

          <div className="mt-auto border-t border-border/70 px-3 py-3 sm:px-4">
            <p className="mb-1.5 px-2 text-2xs font-semibold uppercase tracking-wider text-fg-muted">
              Quick links
            </p>
            <nav className="space-y-0.5">
              {QUICK_LINKS.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-2/70"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2 text-fg-muted transition-colors group-hover:bg-brand-soft group-hover:text-brand">
                    <l.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-fg">{l.label}</span>
                    <span className="block text-2xs text-fg-muted">{l.description}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-fg-muted opacity-0 transition-opacity group-hover:opacity-60" />
                </Link>
              ))}
            </nav>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ── Building blocks ────────────────────────────────────────────────────── */

function KpiCard({ label, value, sub, icon: Icon, to, accent }) {
  return (
    <Link
      to={to}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-xs',
        'transition-all duration-150 hover:border-border-strong hover:shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            'grid h-9 w-9 place-items-center rounded-xl transition-colors',
            accent === 'warn' && 'bg-warning-soft text-warning',
            accent === 'alert' && 'bg-danger-soft text-danger',
            accent === 'brand' && 'bg-brand-soft text-brand',
            accent === 'neutral' && 'bg-surface-2 text-fg-secondary',
            !accent && 'bg-surface-2 text-fg-secondary'
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <ChevronRight className="h-4 w-4 text-fg-muted opacity-0 transition-opacity group-hover:opacity-50" />
      </div>
      <p className="mt-3 text-xs font-medium text-fg-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-fg">{value}</p>
      <p
        className={cn(
          'mt-1 text-xs leading-snug',
          accent === 'warn' && 'text-warning',
          accent === 'alert' && 'text-danger',
          (accent === 'brand' || accent === 'neutral' || !accent) && 'text-fg-muted'
        )}
      >
        {sub}
      </p>
    </Link>
  );
}

function Chip({ children }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg px-2.5 py-1 text-xs">
      {children}
    </div>
  );
}

function FootCell({ label, value }) {
  return (
    <div className="bg-surface px-4 py-3.5 sm:px-5">
      <p className="text-2xs font-medium uppercase tracking-wider text-fg-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums tracking-tight text-fg">{value}</p>
    </div>
  );
}

function UsageRow({ label, used, limit }) {
  const unlimited = limit == null;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
  const warn = !unlimited && pct >= 80;
  const danger = !unlimited && pct >= 90;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
        <span className="text-fg-secondary">{label}</span>
        <span className="tabular-nums text-fg">
          <span className="font-medium">{used}</span>
          <span className="text-fg-muted">{unlimited ? ' · unlimited' : ` / ${limit}`}</span>
        </span>
      </div>
      {!unlimited && (
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              danger ? 'bg-danger/70' : warn ? 'bg-warning/70' : 'bg-brand/65'
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

function stageIconBg(tone) {
  return {
    warn: 'bg-warning-soft',
    brand: 'bg-brand-soft',
    neutral: 'bg-surface-2',
    good: 'bg-success-soft',
    bad: 'bg-danger-soft',
  }[tone];
}

function stageIconColor(tone) {
  return {
    warn: 'text-warning',
    brand: 'text-brand',
    neutral: 'text-fg-muted',
    good: 'text-success',
    bad: 'text-danger',
  }[tone];
}

function stageBarColor(tone) {
  return {
    warn: 'bg-warning/55',
    brand: 'bg-brand/60',
    neutral: 'bg-fg-muted/40',
    good: 'bg-success/55',
    bad: 'bg-danger/50',
  }[tone];
}

function DashboardSkeleton() {
  return (
    <div className="mt-8 space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-4">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="mt-3 h-3 w-20" />
            <Skeleton className="mt-2 h-7 w-16" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-border bg-surface p-6 lg:col-span-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-2 h-3 w-40" />
          <Skeleton className="mt-8 h-48 w-full rounded-xl" />
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 lg:col-span-2">
          <Skeleton className="h-4 w-24" />
          <div className="mt-6 space-y-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="mt-2 h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
