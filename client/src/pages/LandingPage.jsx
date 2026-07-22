import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Facebook,
  Inbox,
  Instagram,
  LayoutDashboard,
  MessageSquare,
  Package,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Users,
  Bell,
  Zap,
  BarChart3,
  Kanban,
  Download,
  Phone,
  Clock,
  X,
  Menu,
  Quote,
} from 'lucide-react';
import { PLAN_LIMITS } from '@dokaandm/shared';
import { Logo } from '../components/brand/Logo.jsx';
import { ThemeToggle } from '../components/ui/ThemeToggle.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { ChannelBadge } from '../components/common/ChannelBadge.jsx';
import { RiskBadge } from '../components/common/RiskBadge.jsx';
import { cn } from '../lib/cn.js';

/* ─────────────────────────────────────────────────────────────────────────
   DokaanDM Marketing Landing — production SaaS layout
   Semantic design tokens only (Ocean blue default accent).
───────────────────────────────────────────────────────────────────────── */

const NAV = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#product', label: 'Product' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

const STATS = [
  { value: 'FB + IG', label: 'One unified inbox' },
  { value: '0%', label: 'Transaction fees' },
  { value: 'COD', label: 'Risk before you ship' },
  { value: 'NPR 899', label: 'Starter · full product' },
];

const PAINS = [
  {
    title: 'DMs everywhere, memory nowhere',
    text: 'Messenger, Instagram, and comments in separate tabs. Who ordered what lives in scrollback.',
  },
  {
    title: 'Orders only in your head',
    text: '15–20 active custom orders tracked by memory. No status, no totals, no paper trail.',
  },
  {
    title: 'COD returns bleed cash',
    text: 'Return-to-origin can hit ~30% in similar markets — shipping both ways, zero revenue.',
  },
];

const FEATURES = [
  {
    icon: Inbox,
    title: 'Unified inbox',
    text: 'Facebook and Instagram threads in one workspace. Search, filters, unread state, and native replies.',
    points: ['Meta OAuth + webhooks', 'Channel badges & filters', 'Optimistic send + retry'],
  },
  {
    icon: ShoppingBag,
    title: 'Order capture',
    text: 'Turn any conversation into a tracked order in seconds — line items, phone, address, payment type.',
    points: ['Prefilled from chat', 'DKN sequential numbers', 'Status pipeline'],
  },
  {
    icon: Package,
    title: 'Product catalog',
    text: 'Searchable catalog with optional inventory. Link products to orders; name and price snapshot.',
    points: ['SKU + name search', 'Stock tracking', 'CSV export on paid'],
  },
  {
    icon: Users,
    title: 'Customer CRM',
    text: 'Phone-keyed identity across channels. Notes, tags, lifetime value, and follow-up reminders.',
    points: ['No duplicate profiles', 'VIP / risky tags', 'Due reminders'],
  },
  {
    icon: ShieldCheck,
    title: 'COD risk signals',
    text: 'Rule-based risk from your own history — new, reliable, medium, or risky — before you confirm COD.',
    points: ['Deterministic scoring', 'Shown at confirm', 'No ML black box'],
  },
  {
    icon: LayoutDashboard,
    title: 'Business dashboard',
    text: 'Today’s orders, pending COD, follow-ups due, monthly revenue, and a 30-day chart.',
    points: ['Pipeline counts', 'Revenue trends', 'Overdue follow-ups'],
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Connect your channels',
    text: 'Link Facebook Pages and Instagram business accounts with secure Meta OAuth. Messages land via webhooks.',
    icon: MessageSquare,
  },
  {
    step: '02',
    title: 'Reply & capture orders',
    text: 'Answer in one inbox. Create an order from any thread — phone resolves the customer automatically.',
    icon: ShoppingBag,
  },
  {
    step: '03',
    title: 'Ship smarter',
    text: 'Run the pipeline, watch COD risk, set reminders, and grow with a catalog and dashboard that scale with you.',
    icon: ShieldCheck,
  },
];

const COMPARISON = [
  { feature: 'Works inside FB & IG DMs', dookaan: true, storefront: false },
  { feature: 'Unified omnichannel inbox', dookaan: true, storefront: 'partial' },
  { feature: 'Order capture from chat', dookaan: true, storefront: false },
  { feature: 'COD risk from your history', dookaan: true, storefront: false },
  { feature: 'Lightweight CRM & reminders', dookaan: true, storefront: 'partial' },
  { feature: 'Requires a separate storefront', dookaan: false, storefront: true },
  { feature: 'Transaction / service fees', dookaan: false, storefront: true },
  { feature: 'Priced under market anchor', dookaan: true, storefront: false },
];

const FAQS = [
  {
    q: 'Do I need a website or online store?',
    a: 'No. DokaanDM layers onto the Facebook and Instagram presence you already use. There is no storefront to host or maintain.',
  },
  {
    q: 'How does COD risk work?',
    a: 'We score each customer from your own delivered and returned orders — transparent rules, not machine learning. Labels: new, reliable, medium, or risky — always with the numbers behind them.',
  },
  {
    q: 'Is Facebook and Instagram really unified?',
    a: 'Yes on paid plans. Threads normalize to one schema so you reply from a single inbox. Free includes one channel (FB or IG) to try the workflow.',
  },
  {
    q: 'Are there payment or transaction fees?',
    a: 'No. DokaanDM is a clean subscription. Payment type and reference are logged on orders; we do not process payments or take a cut.',
  },
  {
    q: 'Can I start free?',
    a: 'Yes. Free includes one channel, 40 orders/month, and 25 products/customers — enough to validate the workflow. Upgrade when you need FB+IG together, COD risk, CRM, and the dashboard.',
  },
  {
    q: 'Who is this built for?',
    a: 'Nepali social-commerce sellers running real volume in DMs — solo shops first, then growing teams with helpers and multiple pages.',
  },
];

function scrollToId(id) {
  const el = document.querySelector(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function formatLimit(n) {
  if (n == null || !Number.isFinite(n)) return 'Unlimited';
  return n.toLocaleString('en-NP');
}

/* ─── Shell ─────────────────────────────────────────────────────────────── */

function LandingNav({ mobileOpen, setMobileOpen }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-colors duration-200',
        scrolled
          ? 'border-border bg-surface/90 backdrop-blur-md shadow-xs'
          : 'border-transparent bg-bg/80 backdrop-blur-sm'
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="#top" className="shrink-0" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <Logo size="md" />
        </a>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                scrollToId(item.href);
              }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-fg-secondary transition-colors hover:bg-surface-2 hover:text-fg"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle size="sm" />
          <Link
            to="/login"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-fg-secondary transition-colors hover:bg-surface-2 hover:text-fg sm:inline-flex"
          >
            Sign in
          </Link>
          <Link to="/register" className="hidden sm:inline-flex">
            <Button variant="primary" size="md">
              Start free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-fg-secondary hover:bg-surface-2 md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-surface px-4 py-4 md:hidden animate-fade-in">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  setMobileOpen(false);
                  scrollToId(item.href);
                }}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-fg-secondary hover:bg-surface-2 hover:text-fg"
              >
                {item.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="secondary" size="lg" className="w-full">
                  Sign in
                </Button>
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)}>
                <Button variant="primary" size="lg" className="w-full">
                  Start free
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

/* ─── Product mockups ───────────────────────────────────────────────────── */

function InboxMock() {
  const threads = [
    {
      name: 'Anisha K.',
      channel: 'instagram',
      snippet: 'Yes, black M still available?',
      time: '2m',
      unread: true,
      risk: null,
    },
    {
      name: 'Ramesh Thapa',
      channel: 'facebook',
      snippet: 'Order confirmed — COD Kathmandu',
      time: '18m',
      unread: false,
      risk: 'reliable',
    },
    {
      name: 'Sita Gurung',
      channel: 'instagram',
      snippet: 'When will the new color drop?',
      time: '1h',
      unread: true,
      risk: null,
    },
    {
      name: 'Bikash S.',
      channel: 'facebook',
      snippet: 'Can I change the address?',
      time: '3h',
      unread: false,
      risk: 'medium',
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
      <div className="flex items-center justify-between border-b border-border bg-surface-2/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-success" />
          <span className="text-xs font-medium text-fg">Inbox</span>
          <Badge tone="ocean">3 unread</Badge>
        </div>
        <div className="flex gap-1.5">
          <ChannelBadge type="facebook" size="sm" />
          <ChannelBadge type="instagram" size="sm" />
        </div>
      </div>
      <div className="divide-y divide-border">
        {threads.map((t) => (
          <div
            key={t.name}
            className={cn(
              'flex items-start gap-3 px-4 py-3 transition-colors',
              t.unread ? 'bg-brand-soft/40' : 'hover:bg-surface-2/50'
            )}
          >
            <div className="relative mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold text-fg-secondary">
              {t.name
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)}
              <span className="absolute -bottom-0.5 -right-0.5">
                <span
                  className={cn(
                    'grid h-3.5 w-3.5 place-items-center rounded-full ring-2 ring-surface',
                    t.channel === 'instagram' ? 'bg-[#E1306C]' : 'bg-[#1877F2]'
                  )}
                >
                  {t.channel === 'instagram' ? (
                    <Instagram className="h-2 w-2 text-white" />
                  ) : (
                    <Facebook className="h-2 w-2 text-white" />
                  )}
                </span>
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className={cn('truncate text-sm', t.unread ? 'font-semibold text-fg' : 'font-medium text-fg')}>
                  {t.name}
                </p>
                <span className="shrink-0 text-2xs text-fg-muted">{t.time}</span>
              </div>
              <p className="truncate text-xs text-fg-muted">{t.snippet}</p>
              {t.risk && (
                <div className="mt-1.5">
                  <RiskBadge label={t.risk} size="sm" />
                </div>
              )}
            </div>
            {t.unread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderMock() {
  const stages = [
    { key: 'Pending', count: 4, tone: 'warn' },
    { key: 'Confirmed', count: 7, tone: 'ocean' },
    { key: 'Shipped', count: 5, tone: 'neutral' },
    { key: 'Delivered', count: 12, tone: 'good' },
  ];
  const orders = [
    { id: 'DKN-000184', name: 'Anisha K.', total: '2,450', status: 'Pending', risk: 'new' },
    { id: 'DKN-000183', name: 'Ramesh T.', total: '1,890', status: 'Confirmed', risk: 'reliable' },
    { id: 'DKN-000182', name: 'Bikash S.', total: '3,200', status: 'Confirmed', risk: 'medium' },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Kanban className="h-4 w-4 text-brand" />
          <span className="text-xs font-medium text-fg">Order pipeline</span>
        </div>
        <Badge tone="ocean">Today · 8 orders</Badge>
      </div>
      <div className="grid grid-cols-4 gap-2 border-b border-border bg-surface-2/40 p-3">
        {stages.map((s) => (
          <div key={s.key} className="rounded-lg border border-border bg-surface px-2 py-2 text-center">
            <p className="text-lg font-semibold tabular-nums text-fg">{s.count}</p>
            <p className="text-2xs text-fg-muted">{s.key}</p>
          </div>
        ))}
      </div>
      <div className="divide-y divide-border">
        {orders.map((o) => (
          <div key={o.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-fg">{o.id}</p>
                <RiskBadge label={o.risk} />
              </div>
              <p className="text-xs text-fg-muted">{o.name} · COD</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold tabular-nums text-fg">NPR {o.total}</p>
              <p className="text-2xs text-fg-muted">{o.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskMock() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
      <div className="border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-warning" />
          <span className="text-xs font-medium text-fg">COD confirmation</span>
        </div>
      </div>
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-fg">Bikash Sharma</p>
            <p className="text-xs text-fg-muted">+977 98× ××× ××41 · Facebook</p>
          </div>
          <RiskBadge label="medium" size="md" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Delivered', value: '6' },
            { label: 'Returned', value: '2' },
            { label: 'Return rate', value: '25%' },
          ].map((m) => (
            <div key={m.label} className="rounded-lg bg-surface-2 px-2.5 py-2 text-center">
              <p className="text-base font-semibold tabular-nums text-fg">{m.value}</p>
              <p className="text-2xs text-fg-muted">{m.label}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-warning/30 bg-warning-soft px-3 py-2.5 text-xs text-warning">
          Higher return rate than your reliable buyers. Confirm phone & address before shipping COD.
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1 pointer-events-none">
            Cancel
          </Button>
          <Button variant="primary" size="sm" className="flex-1 pointer-events-none">
            Confirm COD
          </Button>
        </div>
      </div>
    </div>
  );
}

function DashboardMock() {
  const cards = [
    { label: "Today's orders", value: '8', sub: 'NPR 18,420', icon: ShoppingBag },
    { label: 'COD pending', value: '3', sub: 'Need confirm', icon: Clock },
    { label: 'Follow-ups due', value: '5', sub: '2 overdue', icon: Bell },
    { label: 'Revenue (mo)', value: '1.2L', sub: '+14% vs last', icon: BarChart3 },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-4 w-4 text-brand" />
          <span className="text-xs font-medium text-fg">Dashboard</span>
        </div>
        <span className="text-2xs text-fg-muted">Live · your shop</span>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-border bg-bg p-3">
            <div className="mb-2 flex items-center justify-between">
              <c.icon className="h-3.5 w-3.5 text-fg-muted" />
            </div>
            <p className="text-lg font-semibold tabular-nums tracking-tight text-fg">{c.value}</p>
            <p className="text-2xs font-medium text-fg-secondary">{c.label}</p>
            <p className="text-2xs text-fg-muted">{c.sub}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-4 py-3">
        <p className="mb-2 text-2xs font-medium uppercase tracking-wider text-fg-muted">
          30-day revenue
        </p>
        <div className="flex h-16 items-end gap-1">
          {[40, 55, 35, 70, 50, 85, 60, 75, 45, 90, 65, 80, 55, 95, 70, 60, 88, 72, 50, 92, 68, 78, 58, 84, 76, 62, 90, 70, 85, 95].map(
            (h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-brand/20 transition-colors first:rounded-l last:rounded-r"
                style={{ height: `${h}%` }}
              >
                <div className="h-full w-full rounded-sm bg-brand/70" style={{ opacity: 0.4 + (h / 100) * 0.6 }} />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Sections ──────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border" id="top">
      {/* Subtle grid + brand glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4] dark:opacity-[0.25]"
        aria-hidden
        style={{
          backgroundImage:
            'linear-gradient(to right, rgb(var(--border) / 0.6) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--border) / 0.6) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 20%, transparent 70%)',
        }}
      />
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-brand/10 blur-3xl dark:bg-brand/15"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8 lg:pb-24 lg:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-fg-secondary shadow-xs">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Sparkles className="h-3 w-3" />
            </span>
            Built for Nepali social commerce
            <span className="hidden h-1 w-1 rounded-full bg-border-strong sm:inline" />
            <span className="hidden items-center gap-1 sm:inline-flex">
              <Facebook className="h-3 w-3 text-[#1877F2]" />
              <Instagram className="h-3 w-3 text-[#E1306C]" />
            </span>
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-fg sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            Sell where your customers{' '}
            <span className="text-brand">already are</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-fg-secondary sm:text-lg">
            DokaanDM is the operations layer for Facebook & Instagram sellers — unified inbox,
            instant order capture, customer memory, and COD risk signals. No storefront required.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/register">
              <Button variant="primary" size="lg" className="min-w-[160px] shadow-md shadow-brand/20">
                Start free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a
              href="#product"
              onClick={(e) => {
                e.preventDefault();
                scrollToId('#product');
              }}
            >
              <Button variant="secondary" size="lg" className="min-w-[160px]">
                See the product
              </Button>
            </a>
          </div>

          <p className="mt-4 text-xs text-fg-muted">
            Free plan · no card · no transaction fees · upgrade when you grow
          </p>
        </div>

        {/* Hero product frame */}
        <div className="relative mx-auto mt-14 max-w-5xl lg:mt-16">
          <div className="absolute -inset-3 rounded-2xl bg-brand/5 blur-xl dark:bg-brand/10" aria-hidden />
          <div className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
            <div className="flex items-center gap-2 border-b border-border bg-surface-2/80 px-4 py-2.5">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
                <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
                <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
              </div>
              <div className="ml-2 flex flex-1 items-center justify-center">
                <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1 text-2xs text-fg-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  app.dokaandm · workspace
                </div>
              </div>
            </div>
            <div className="grid gap-0 lg:grid-cols-5">
              <div className="border-b border-border p-3 lg:col-span-2 lg:border-b-0 lg:border-r">
                <InboxMock />
              </div>
              <div className="space-y-3 p-3 lg:col-span-3">
                <DashboardMock />
                <div className="hidden sm:block">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <OrderMock />
                    <RiskMock />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">{s.value}</p>
              <p className="mt-0.5 text-xs text-fg-muted sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section className="border-b border-border bg-surface py-16 sm:py-20" id="problem">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">The problem</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
            Social sellers run a real business inside DMs
          </h2>
          <p className="mt-3 text-base text-fg-secondary">
            Storefront-first tools push you onto a website. Your customers are already messaging you.
            DokaanDM meets them — and you — there.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {PAINS.map((p, i) => (
            <div
              key={p.title}
              className="relative rounded-xl border border-border bg-bg p-6 shadow-xs"
            >
              <span className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-danger-soft text-sm font-semibold text-danger">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="text-base font-semibold text-fg">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-secondary">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="border-b border-border py-16 sm:py-20" id="features">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">Everything you need</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
            Operations software for social commerce
          </h2>
          <p className="mt-3 text-base text-fg-secondary">
            Inbox, orders, catalog, CRM, risk, and dashboard — multi-tenant and plan-gated from day one.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="group flex flex-col rounded-xl border border-border bg-surface p-6 shadow-xs transition-shadow hover:shadow-md"
            >
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-brand-fg">
                <f.icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h3 className="text-base font-semibold text-fg">{f.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-fg-secondary">{f.text}</p>
              <ul className="mt-4 space-y-1.5 border-t border-border pt-4">
                {f.points.map((pt) => (
                  <li key={pt} className="flex items-center gap-2 text-xs text-fg-secondary">
                    <Check className="h-3.5 w-3.5 shrink-0 text-brand" strokeWidth={2.5} />
                    {pt}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="border-b border-border bg-surface py-16 sm:py-20" id="how-it-works">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">How it works</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
            Live in minutes, not weeks
          </h2>
          <p className="mt-3 text-base text-fg-secondary">
            Connect channels, capture orders from chat, and stop guessing on COD.
          </p>
        </div>

        <div className="relative mt-14 grid gap-8 md:grid-cols-3 md:gap-6">
          <div
            className="pointer-events-none absolute left-[16%] right-[16%] top-10 hidden h-px bg-border md:block"
            aria-hidden
          />
          {STEPS.map((s) => (
            <div key={s.step} className="relative text-center md:text-left">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-bg shadow-xs md:mx-0">
                <s.icon className="h-5 w-5 text-brand" strokeWidth={1.75} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand">{s.step}</p>
              <h3 className="mt-1 text-lg font-semibold text-fg">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-secondary">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductDeepDive() {
  const blocks = [
    {
      id: 'inbox',
      eyebrow: 'Unified inbox',
      title: 'One workspace for Facebook & Instagram',
      text: 'Threads arrive via Meta webhooks, normalize to one schema, and render the same way. Filter by channel, unread, or has-order. Reply natively — no app-hopping.',
      bullets: [
        'OAuth 2.0 connect for Pages & IG business',
        'Unread state, search, keyboard-friendly flows',
        'Outbound queue respects Meta rate limits',
      ],
      mock: <InboxMock />,
      reverse: false,
    },
    {
      id: 'orders',
      eyebrow: 'Order capture',
      title: 'From chat to pipeline in seconds',
      text: 'Create order from any conversation. Line items, phone, address, payment type. Sequential DKN numbers, totals auto-computed, status pipeline with audit trail.',
      bullets: [
        'pending → confirmed → shipped → delivered',
        'Link catalog products; inventory decrements',
        'Kanban board on paid plans',
      ],
      mock: <OrderMock />,
      reverse: true,
    },
    {
      id: 'risk',
      eyebrow: 'COD risk',
      title: 'Know who is risky before you ship',
      text: 'Your #1 differentiator. Transparent, rule-based scores from your own history — always shown with the underlying delivered/returned counts.',
      bullets: [
        'Labels: new · reliable · medium · risky',
        'Surfaced on profile and at COD confirm',
        'Unit-tested pure logic — no black box',
      ],
      mock: <RiskMock />,
      reverse: false,
    },
    {
      id: 'crm',
      eyebrow: 'CRM & catalog',
      title: 'Remember the relationship',
      text: 'Phone identity across channels means one customer profile — order history, total spent, notes, tags, and date-based reminders that surface on the dashboard.',
      bullets: [
        'Provisional profiles promote when phone appears',
        'Product catalog with SKU search & stock',
        'Reminders for restocks and follow-ups',
      ],
      mock: (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          <div className="border-b border-border px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-brand" />
              <span className="text-xs font-medium text-fg">Customer · Anisha Karki</span>
            </div>
          </div>
          <div className="space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="ocean">VIP</Badge>
              <RiskBadge label="reliable" />
              <Badge tone="neutral">
                <Phone className="h-3 w-3" /> +977 98× ××× ××07
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { l: 'Orders', v: '11' },
                { l: 'Total spent', v: 'NPR 42k' },
                { l: 'Returns', v: '0' },
              ].map((x) => (
                <div key={x.l} className="rounded-lg bg-surface-2 px-2 py-2 text-center">
                  <p className="text-sm font-semibold text-fg">{x.v}</p>
                  <p className="text-2xs text-fg-muted">{x.l}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-border bg-bg px-3 py-2 text-xs text-fg-secondary">
              <span className="font-medium text-fg">Note · </span>
              Prefers black sizes M. Follow up when restock hits.
            </div>
            <div className="flex items-center gap-2 text-xs text-fg-muted">
              <Bell className="h-3.5 w-3.5 text-brand" />
              Reminder · Restock alert · due Fri
            </div>
          </div>
        </div>
      ),
      reverse: true,
    },
  ];

  return (
    <section className="border-b border-border py-16 sm:py-20" id="product">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">Product tour</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
            Built around how sellers actually work
          </h2>
          <p className="mt-3 text-base text-fg-secondary">
            Capture beats configuration. Memory is the moat. Every surface is multi-tenant safe.
          </p>
        </div>

        <div className="mt-16 space-y-20">
          {blocks.map((b) => (
            <div
              key={b.id}
              className={cn(
                'grid items-center gap-10 lg:grid-cols-2 lg:gap-14',
                b.reverse && 'lg:[&>*:first-child]:order-2'
              )}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand">{b.eyebrow}</p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-fg sm:text-2xl">
                  {b.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-fg-secondary">{b.text}</p>
                <ul className="mt-6 space-y-3">
                  {b.bullets.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-fg-secondary">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                        <Check className="h-3 w-3" strokeWidth={2.5} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="landing-float">{b.mock}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  return (
    <section className="border-b border-border bg-surface py-16 sm:py-20" id="compare">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">Positioning</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
            Not another storefront
          </h2>
          <p className="mt-3 text-base text-fg-secondary">
            Competitors push branded websites. DokaanDM layers onto DMs — structurally cheaper to run,
            priced meaningfully under the ~NPR 2,499 market anchor.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-xl border border-border bg-bg shadow-xs">
          <div className="grid grid-cols-[1fr_auto_auto] gap-0 border-b border-border bg-surface-2/60 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-fg-muted sm:px-6">
            <span>Capability</span>
            <span className="w-24 text-center text-brand sm:w-28">DokaanDM</span>
            <span className="w-24 text-center sm:w-28">Storefront tools</span>
          </div>
          {COMPARISON.map((row, i) => (
            <div
              key={row.feature}
              className={cn(
                'grid grid-cols-[1fr_auto_auto] items-center gap-0 px-4 py-3.5 text-sm sm:px-6',
                i % 2 === 1 && 'bg-surface-2/30',
                i < COMPARISON.length - 1 && 'border-b border-border'
              )}
            >
              <span className="pr-4 text-fg-secondary">{row.feature}</span>
              <span className="flex w-24 justify-center sm:w-28">
                <Cell value={row.dookaan} positive />
              </span>
              <span className="flex w-24 justify-center sm:w-28">
                <Cell value={row.storefront} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cell({ value, positive }) {
  if (value === true) {
    return (
      <span
        className={cn(
          'grid h-6 w-6 place-items-center rounded-full',
          positive ? 'bg-success-soft text-success' : 'bg-surface-2 text-fg-muted'
        )}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="grid h-6 w-6 place-items-center rounded-full bg-surface-2 text-fg-muted">
        <X className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
    );
  }
  return <span className="text-xs font-medium text-fg-muted">Partial</span>;
}

function PricingSection() {
  const [annual, setAnnual] = useState(false);

  const tiers = ['free', 'starter', 'growth', 'business'].map((key) => {
    const p = PLAN_LIMITS[key];
    return { key, ...p };
  });

  const featureRows = [
    { key: 'cod_risk', label: 'COD risk flagging', icon: ShieldCheck },
    { key: 'dashboard', label: 'Business dashboard', icon: LayoutDashboard },
    { key: 'crm', label: 'CRM notes, tags & reminders', icon: Tag },
    { key: 'kanban', label: 'Full order pipeline (kanban)', icon: Kanban },
    { key: 'csv_export', label: 'CSV export', icon: Download },
  ];

  function priceLabel(tier) {
    if (tier.pricePerMonthNpr == null) return { main: 'Custom', sub: 'Tailored limits' };
    if (tier.pricePerMonthNpr === 0) return { main: 'Free', sub: 'Forever' };
    if (annual && tier.pricePerYearNpr) {
      const mo = Math.round(tier.pricePerYearNpr / 12);
      return {
        main: `NPR ${mo.toLocaleString('en-NP')}`,
        sub: `billed NPR ${tier.pricePerYearNpr.toLocaleString('en-NP')}/yr`,
      };
    }
    return {
      main: `NPR ${tier.pricePerMonthNpr.toLocaleString('en-NP')}`,
      sub: 'per month',
    };
  }

  return (
    <section className="border-b border-border py-16 sm:py-20" id="pricing">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">Pricing</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
            Simple plans. Zero transaction fees.
          </h2>
          <p className="mt-3 text-base text-fg-secondary">
            Paid tiers share the full product — you scale on limits, not feature gates. Annual saves 2 months.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <div
            className="inline-flex items-center rounded-lg border border-border bg-surface-2 p-0.5"
            role="group"
            aria-label="Billing period"
          >
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={cn(
                'rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors',
                !annual ? 'bg-surface text-fg shadow-xs' : 'text-fg-muted hover:text-fg'
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={cn(
                'rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors',
                annual ? 'bg-surface text-fg shadow-xs' : 'text-fg-muted hover:text-fg'
              )}
            >
              Annual
              <span className="ml-1.5 text-2xs font-semibold text-brand">−2 mo</span>
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-4">
          {tiers.map((tier) => {
            const popular = tier.key === 'starter';
            const price = priceLabel(tier);
            const isFree = tier.key === 'free';
            const isBiz = tier.key === 'business';

            return (
              <div
                key={tier.key}
                className={cn(
                  'relative flex flex-col rounded-xl border bg-surface p-5 shadow-xs',
                  popular
                    ? 'border-brand ring-2 ring-brand/20 shadow-md lg:-mt-1 lg:mb-1 lg:pb-6 lg:pt-6'
                    : 'border-border'
                )}
              >
                {popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-md bg-brand px-2.5 py-0.5 text-2xs font-semibold text-brand-fg">
                    <Star className="h-3 w-3" /> Most popular
                  </span>
                )}
                <p className="text-sm font-semibold text-fg">{tier.label}</p>
                <div className="mt-3">
                  <p className="text-3xl font-semibold tracking-tight text-fg">{price.main}</p>
                  <p className="mt-0.5 text-xs text-fg-muted">{price.sub}</p>
                </div>

                <ul className="mt-5 flex-1 space-y-2.5 text-sm text-fg-secondary">
                  <Li>
                    {formatLimit(tier.channels)} channel{tier.channels === 1 ? '' : 's'}
                    {tier.singleChannelType ? ' (FB or IG)' : tier.channels === 2 ? ' (FB + IG)' : ''}
                  </Li>
                  <Li>{formatLimit(tier.ordersPerMonth)} orders / month</Li>
                  <Li>{formatLimit(tier.customers)} customers</Li>
                  <Li>{formatLimit(tier.products)} products</Li>
                  <Li>
                    {formatLimit(tier.teamLogins)} team login
                    {tier.teamLogins === 1 ? '' : 's'}
                  </Li>
                  {featureRows.map((f) =>
                    tier.features.has(f.key) ? (
                      <Li key={f.key}>{f.label}</Li>
                    ) : (
                      <li key={f.key} className="flex items-start gap-2 text-fg-muted">
                        <X className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-50" />
                        <span className="line-through decoration-border-strong">{f.label}</span>
                      </li>
                    )
                  )}
                  <Li>{tier.support}</Li>
                </ul>

                <div className="mt-6">
                  {isBiz ? (
                    <a href={`mailto:support@dokaandm.app?subject=Business%20plan`}>
                      <Button variant="secondary" size="lg" className="w-full">
                        Contact us
                      </Button>
                    </a>
                  ) : (
                    <Link to="/register">
                      <Button
                        variant={popular ? 'primary' : 'secondary'}
                        size="lg"
                        className="w-full"
                      >
                        {isFree ? 'Start free' : 'Get started'}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-fg-muted">
          Market anchor ~NPR 2,499/mo. Starter is ~64% cheaper. No payment processing fees — ever.
        </p>
      </div>
    </section>
  );
}

function Li({ children }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" strokeWidth={2.5} />
      <span>{children}</span>
    </li>
  );
}

function TestimonialSection() {
  return (
    <section className="border-b border-border bg-surface py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="rounded-2xl border border-border bg-bg p-8 shadow-xs lg:col-span-3">
            <Quote className="h-8 w-8 text-brand/30" />
            <blockquote className="mt-4 text-xl font-medium leading-relaxed tracking-tight text-fg sm:text-2xl">
              “I used to lose orders in Messenger scrollback. Now every DM can become a tracked order —
              and I finally see who keeps returning COD before I ship.”
            </blockquote>
            <div className="mt-6 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-brand text-sm font-semibold text-brand-fg">
                PK
              </div>
              <div>
                <p className="text-sm font-semibold text-fg">Pilot seller · Kathmandu</p>
                <p className="text-xs text-fg-muted">Fashion · Facebook + Instagram</p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-1">
            {[
              {
                icon: Zap,
                title: 'Capture in seconds',
                text: 'Order form prefilled from the conversation. Phone resolves the customer.',
              },
              {
                icon: ShieldCheck,
                title: 'Risk you can explain',
                text: 'Every COD badge shows the real numbers — not a mystery score.',
              },
              {
                icon: BarChart3,
                title: 'Day-one dashboard',
                text: 'Orders, COD pending, follow-ups, and revenue — scoped only to your shop.',
              },
            ].map((c) => (
              <div key={c.title} className="rounded-xl border border-border bg-bg p-5 shadow-xs">
                <c.icon className="h-5 w-5 text-brand" strokeWidth={1.75} />
                <p className="mt-3 text-sm font-semibold text-fg">{c.title}</p>
                <p className="mt-1 text-sm text-fg-secondary">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const [open, setOpen] = useState(0);

  return (
    <section className="border-b border-border py-16 sm:py-20" id="faq">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">FAQ</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
            Questions, answered
          </h2>
        </div>

        <div className="mt-10 divide-y divide-border rounded-xl border border-border bg-surface shadow-xs">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-medium text-fg sm:text-base">{item.q}</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-fg-muted transition-transform',
                      isOpen && 'rotate-180'
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-sm leading-relaxed text-fg-secondary animate-fade-in">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden border-b border-border py-16 sm:py-20">
      <div
        className="pointer-events-none absolute inset-0 bg-brand"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 50%, white 0%, transparent 40%), radial-gradient(circle at 80% 20%, white 0%, transparent 35%)',
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Ready to run your DM business like a system?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base text-white/75">
          Start free. Connect a channel. Capture your first order from a conversation.
          Upgrade when you need FB + IG together and COD risk.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/register">
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 text-md font-medium text-brand shadow-md transition hover:bg-white/95"
            >
              Create free account
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
          <Link to="/login">
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/30 bg-transparent px-5 text-md font-medium text-white transition hover:bg-white/10"
            >
              Sign in
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-surface py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo size="md" />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-fg-secondary">
              Omnichannel inbox, order capture, and lightweight CRM for Nepali social-commerce sellers.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#1877F2] text-white">
                <Facebook className="h-4 w-4" />
              </span>
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#E1306C] text-white">
                <Instagram className="h-4 w-4" />
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Product</p>
            <ul className="mt-3 space-y-2 text-sm text-fg-secondary">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a
                    href={n.href}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToId(n.href);
                    }}
                    className="transition-colors hover:text-fg"
                  >
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Account</p>
            <ul className="mt-3 space-y-2 text-sm text-fg-secondary">
              <li>
                <Link to="/login" className="transition-colors hover:text-fg">
                  Sign in
                </Link>
              </li>
              <li>
                <Link to="/register" className="transition-colors hover:text-fg">
                  Create account
                </Link>
              </li>
              <li>
                <a href="mailto:support@dokaandm.app" className="transition-colors hover:text-fg">
                  Support
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Principles</p>
            <ul className="mt-3 space-y-2 text-sm text-fg-secondary">
              <li>Meet sellers where they are</li>
              <li>Capture beats configuration</li>
              <li>Memory is the moat</li>
              <li>Multi-tenant by default</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-fg-muted">© {year} DokaanDM. All rights reserved.</p>
          <p className="text-xs text-fg-muted">Sell where your customers already are.</p>
        </div>
      </div>
    </footer>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.title = 'DokaanDM — Inbox, orders & CRM for social sellers';
    return () => {
      document.title = 'DokaanDM';
    };
  }, []);

  return (
    <div className="min-h-screen bg-bg text-fg">
      <LandingNav mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main>
        <Hero />
        <ProblemSection />
        <FeaturesSection />
        <HowItWorks />
        <ProductDeepDive />
        <ComparisonSection />
        <PricingSection />
        <TestimonialSection />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
