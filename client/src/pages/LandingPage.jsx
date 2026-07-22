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
  ShieldCheck,
  ShoppingBag,
  Star,
  Users,
  Zap,
  X,
  Menu,
  Quote,
} from 'lucide-react';
import { PLAN_LIMITS } from '@dokaandm/shared';
import { Logo } from '../components/brand/Logo.jsx';
import { ThemeToggle } from '../components/ui/ThemeToggle.jsx';
import { Button } from '../components/ui/Button.jsx';
import { useThemeStore } from '../store/themeStore.js';
import { cn } from '../lib/cn.js';

/* ── Themed product screenshots (public/screenshots/*-light|dark.png) ─── */
const SHOT_KEYS = ['dashboard', 'inbox', 'orders', 'products', 'customers'];

function shotPath(key, mode) {
  return `/screenshots/${key}-${mode}.png`;
}

const NAV = [
  { href: '#features', label: 'Features' },
  { href: '#product', label: 'Product' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

const STATS = [
  { value: 'One inbox', label: 'Facebook & Instagram together' },
  { value: 'Zero fees', label: 'No cut of your sales' },
  { value: 'COD risk', label: 'Flagged before you ship' },
  { value: 'NPR 899', label: 'Starter · full product' },
];

const FEATURES = [
  {
    icon: Inbox,
    title: 'Unified inbox',
    text: 'Facebook and Instagram threads in one workspace. Search, filters, unread state, and native replies.',
  },
  {
    icon: ShoppingBag,
    title: 'Order capture',
    text: 'Turn any conversation into a tracked order in seconds — line items, phone, address, payment type.',
  },
  {
    icon: Package,
    title: 'Product catalog',
    text: 'Searchable catalog with optional inventory. Link products to orders; name and price snapshot.',
  },
  {
    icon: Users,
    title: 'Customer CRM',
    text: 'Phone-keyed identity across channels. Notes, tags, total spent, and follow-up reminders.',
  },
  {
    icon: ShieldCheck,
    title: 'COD risk signals',
    text: 'Rule-based risk from your own history — transparent numbers before you confirm COD.',
  },
  {
    icon: LayoutDashboard,
    title: 'Business dashboard',
    text: "Today's orders, pending COD, follow-ups due, monthly revenue, and a 30-day chart.",
  },
];

const PRODUCT_BLOCKS = [
  {
    id: 'inbox',
    key: 'inbox',
    eyebrow: 'Unified inbox',
    title: 'Reply to Facebook & Instagram in one place',
    text: 'Threads arrive via Meta webhooks, normalize to one schema, and render the same way. Filter by channel, unread, or has-order — then capture an order without leaving the chat.',
    bullets: [
      'OAuth connect for Pages & IG business',
      'Unread state, search, and keyboard shortcuts',
      'Customer context and COD risk beside the thread',
    ],
    alt: 'DokaanDM unified inbox with conversation and customer panel',
  },
  {
    id: 'orders',
    key: 'orders',
    eyebrow: 'Order pipeline',
    title: 'From chat to kanban without retyping',
    text: 'Sequential DKN order numbers, payment type, and status pipeline. Drag cards between stages — COD confirmation surfaces risk before you ship.',
    bullets: [
      'pending → confirmed → shipped → delivered',
      'Board and list views on paid plans',
      'Cash-on-delivery risk gate at confirm',
    ],
    alt: 'DokaanDM orders kanban board',
    reverse: true,
  },
  {
    id: 'dashboard',
    key: 'dashboard',
    eyebrow: 'Dashboard',
    title: 'See the day at a glance',
    text: 'Revenue trends, pipeline health, follow-ups, and plan usage — scoped only to your shop. Built for solo sellers who need signal, not noise.',
    bullets: [
      "Today's orders and month revenue",
      'COD queue and overdue follow-ups',
      'Fulfillment and return rates',
    ],
    alt: 'DokaanDM business dashboard',
  },
  {
    id: 'customers',
    key: 'customers',
    eyebrow: 'CRM',
    title: 'Remember every buyer across channels',
    text: 'Phone identity means one profile for Facebook and Instagram. See order history, total spent, tags, and risk — then set a reminder when stock returns.',
    bullets: [
      'No duplicate profiles when phone appears',
      'Notes, tags, and follow-up reminders',
      'COD risk from your own history',
    ],
    alt: 'DokaanDM customers list',
    reverse: true,
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Connect channels',
    text: 'Link Facebook Pages and Instagram business accounts with Meta OAuth. Messages land via webhooks.',
    icon: MessageSquare,
  },
  {
    step: '02',
    title: 'Reply & capture',
    text: 'Answer in one inbox. Create an order from any thread — phone resolves the customer automatically.',
    icon: ShoppingBag,
  },
  {
    step: '03',
    title: 'Ship smarter',
    text: 'Run the pipeline, check COD risk, set reminders, and grow with catalog and dashboard.',
    icon: ShieldCheck,
  },
];

const FAQS = [
  {
    q: 'Do I need a website or online store?',
    a: 'No. DokaanDM layers onto the Facebook and Instagram presence you already use. There is no storefront to host or maintain.',
  },
  {
    q: 'How does COD risk work?',
    a: 'We score each customer from your own delivered and returned orders — transparent rules, not machine learning. Labels show with the numbers behind them.',
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
    a: 'Yes. Free includes one channel, 40 orders/month, and 25 products/customers. Upgrade when you need FB+IG together, COD risk, CRM, and the dashboard.',
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

function useShotMode() {
  return useThemeStore((s) => s.resolved) === 'dark' ? 'dark' : 'light';
}

/* ── Premium SaaS product showcase ─────────────────────────────────────── */

function ProductShowcase({
  shotKey,
  alt,
  hero = false,
  tilt = false,
  fade = false,
  float = false,
  className,
}) {
  const mode = useShotMode();
  const lightSrc = shotPath(shotKey, 'light');
  const darkSrc = shotPath(shotKey, 'dark');

  return (
    <div
      className={cn(
        'shot-stage',
        tilt && 'shot-stage--tilt',
        float && 'shot-stage--float',
        className
      )}
    >
      <div className={cn('shot-frame', hero && 'shot-frame--hero')}>
        <div className="shot-chrome">
          <div className="shot-dots" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <div className="shot-url">
            <span>
              <span className="live" />
              app.dokaandm · workspace
            </span>
          </div>
        </div>
        <div className="shot-viewport">
          {/* Cross-fade light/dark so theme toggle updates the product shot */}
          <img
            src={lightSrc}
            alt={mode === 'light' ? alt : ''}
            className={cn(mode !== 'light' && 'is-hidden')}
            loading={hero ? 'eager' : 'lazy'}
            decoding="async"
          />
          <img
            src={darkSrc}
            alt={mode === 'dark' ? alt : ''}
            className={cn(mode !== 'dark' && 'is-hidden')}
            loading={hero ? 'eager' : 'lazy'}
            decoding="async"
            aria-hidden={mode !== 'dark'}
          />
          {fade && <div className="shot-fade" aria-hidden />}
        </div>
      </div>
    </div>
  );
}

/* ── Nav ─────────────────────────────────────────────────────────────────── */

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
        'sticky top-0 z-50 border-b transition-all duration-200',
        scrolled
          ? 'border-border bg-surface/90 shadow-xs backdrop-blur-md'
          : 'border-transparent bg-bg/80 backdrop-blur-sm'
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a
          href="#top"
          className="shrink-0"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <Logo size="md" />
        </a>

        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Primary">
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

/* ── Sections ───────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border" id="top">
      {/* Faded grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4] dark:opacity-[0.22]"
        aria-hidden
        style={{
          backgroundImage:
            'linear-gradient(to right, rgb(var(--border) / 0.65) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--border) / 0.65) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage:
            'radial-gradient(ellipse 85% 70% at 50% 0%, black 10%, transparent 72%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 85% 70% at 50% 0%, black 10%, transparent 72%)',
        }}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[min(100%,56rem)] -translate-x-1/2 rounded-[100%] bg-brand/[0.07] blur-3xl dark:bg-brand/[0.14]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8 lg:pb-24 lg:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
            Omnichannel commerce for social sellers
          </p>

          <h1 className="text-balance text-[2.25rem] font-semibold leading-[1.12] tracking-tight text-fg sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]">
            Sell where your customers <span className="text-brand">already are</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-fg-secondary sm:text-lg sm:leading-relaxed">
            Unified inbox, structured order capture, customer history, and COD risk signals —
            built for sellers who operate in DMs, not on a storefront.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-3">
            <Link to="/register">
              <Button variant="primary" size="lg" className="min-w-[168px] px-6">
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
              <Button variant="secondary" size="lg" className="min-w-[168px] px-6">
                View product
              </Button>
            </a>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-fg-muted">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-success" strokeWidth={2.5} />
              Free to start
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-border-strong sm:inline" aria-hidden />
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-success" strokeWidth={2.5} />
              No transaction fees
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-border-strong sm:inline" aria-hidden />
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-success" strokeWidth={2.5} />
              Facebook &amp; Instagram
            </span>
          </div>
        </div>

        {/* Product showcase — restrained float, no gimmicks */}
        <div className="relative mx-auto mt-14 max-w-5xl lg:mt-16">
          <ProductShowcase
            shotKey="dashboard"
            alt="DokaanDM dashboard with revenue chart and order pipeline"
            hero
            tilt
            fade
          />
        </div>

        {/* Trust metrics — quieter, more enterprise */}
        <div className="mx-auto mt-16 max-w-4xl border-t border-border pt-10">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center sm:text-left">
                <p className="text-lg font-semibold tracking-tight text-fg sm:text-xl">{s.value}</p>
                <p className="mt-1 text-xs leading-snug text-fg-muted sm:text-sm">{s.label}</p>
              </div>
            ))}
          </div>
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
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            Everything you need
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
            Operations software for social commerce
          </h2>
          <p className="mt-3 text-base text-fg-secondary">
            Inbox, orders, catalog, CRM, risk, and dashboard — multi-tenant and plan-gated from day
            one.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="group rounded-2xl border border-border bg-surface p-6 shadow-xs transition-shadow hover:shadow-md"
            >
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-brand-fg">
                <f.icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h3 className="text-base font-semibold text-fg">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-secondary">{f.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductTour() {
  return (
    <section className="border-b border-border bg-surface py-16 sm:py-20" id="product">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">Product tour</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
            The real product — not a mockup
          </h2>
          <p className="mt-3 text-base text-fg-secondary">
            Live workspace screenshots. Toggle light or dark in the header — the product previews
            follow your theme.
          </p>
        </div>

        <div className="mt-16 space-y-20 lg:space-y-28">
          {PRODUCT_BLOCKS.map((b) => (
            <div
              key={b.id}
              className={cn(
                'grid items-center gap-10 lg:grid-cols-2 lg:gap-14',
                b.reverse && 'lg:[&>*:first-child]:order-2'
              )}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                  {b.eyebrow}
                </p>
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
              <ProductShowcase shotKey={b.key} alt={b.alt} tilt />
            </div>
          ))}
        </div>

        {/* Secondary strip — products catalog */}
        <div className="mt-20 overflow-hidden rounded-2xl border border-border bg-bg p-6 shadow-xs sm:p-8 lg:p-10">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">Catalog</p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-fg sm:text-2xl">
              Products ready for order capture
            </h3>
            <p className="mt-2 text-sm text-fg-secondary">
              Build once, attach to any conversation. Inventory and pricing stay in sync.
            </p>
          </div>
          <div className="mx-auto mt-8 max-w-4xl">
            <ProductShowcase
              shotKey="products"
              alt="DokaanDM product catalog"
              fade
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="border-b border-border py-16 sm:py-20" id="how-it-works">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">How it works</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
            Live in minutes, not weeks
          </h2>
        </div>
        <div className="relative mt-14 grid gap-8 md:grid-cols-3 md:gap-6">
          <div
            className="pointer-events-none absolute left-[16%] right-[16%] top-10 hidden h-px bg-border md:block"
            aria-hidden
          />
          {STEPS.map((s) => (
            <div key={s.step} className="relative text-center md:text-left">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface shadow-xs md:mx-0">
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

function PricingSection() {
  const [annual, setAnnual] = useState(false);
  const tiers = ['free', 'starter', 'growth', 'business'].map((key) => ({
    key,
    ...PLAN_LIMITS[key],
  }));

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
    <section className="border-b border-border bg-surface py-16 sm:py-20" id="pricing">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">Pricing</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
            Simple plans. Zero transaction fees.
          </h2>
          <p className="mt-3 text-base text-fg-secondary">
            Paid tiers share the full product — you scale on limits. Annual saves 2 months.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <div
            className="inline-flex items-center rounded-lg border border-border bg-bg p-0.5"
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
            return (
              <div
                key={tier.key}
                className={cn(
                  'relative flex flex-col rounded-2xl border bg-bg p-5 shadow-xs',
                  popular
                    ? 'border-brand ring-2 ring-brand/15 shadow-md lg:-mt-1 lg:mb-1 lg:pb-6 lg:pt-6'
                    : 'border-border'
                )}
              >
                {popular && (
                  <span className="absolute -top-2.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-md bg-brand px-2.5 py-0.5 text-2xs font-semibold text-brand-fg">
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
                    {tier.singleChannelType
                      ? ' (FB or IG)'
                      : tier.channels === 2
                        ? ' (FB + IG)'
                        : ''}
                  </Li>
                  <Li>{formatLimit(tier.ordersPerMonth)} orders / month</Li>
                  <Li>{formatLimit(tier.customers)} customers</Li>
                  <Li>{formatLimit(tier.products)} products</Li>
                  {tier.features.has('cod_risk') && <Li>COD risk flagging</Li>}
                  {tier.features.has('dashboard') && <Li>Business dashboard</Li>}
                  {tier.features.has('crm') && <Li>CRM notes, tags &amp; reminders</Li>}
                  <Li>{tier.support}</Li>
                </ul>
                <div className="mt-6">
                  {tier.key === 'business' ? (
                    <a href="mailto:support@dokaandm.app?subject=Business%20plan">
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
                        {tier.key === 'free' ? 'Start free' : 'Get started'}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-8 text-center text-xs text-fg-muted">
          Market anchor ~NPR 2,499/mo. Starter is ~64% cheaper. No payment processing fees.
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

function SocialProof() {
  return (
    <section className="border-b border-border py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="rounded-2xl border border-border bg-surface p-8 shadow-xs lg:col-span-3">
            <Quote className="h-8 w-8 text-brand/30" />
            <blockquote className="mt-4 text-xl font-medium leading-relaxed tracking-tight text-fg sm:text-2xl">
              “I used to lose orders in Messenger scrollback. Now every DM can become a tracked
              order — and I finally see who keeps returning COD before I ship.”
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
                icon: LayoutDashboard,
                title: 'Day-one dashboard',
                text: 'Orders, COD pending, follow-ups, and revenue — scoped only to your shop.',
              },
            ].map((c) => (
              <div
                key={c.title}
                className="rounded-xl border border-border bg-surface p-5 shadow-xs"
              >
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
    <section className="border-b border-border bg-surface py-16 sm:py-20" id="faq">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">FAQ</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
            Questions, answered
          </h2>
        </div>
        <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-bg shadow-xs">
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
      <div className="absolute inset-0 bg-brand" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
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
              Omnichannel inbox, order capture, and lightweight CRM for Nepali social-commerce
              sellers.
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

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.title = 'DokaanDM — Inbox, orders & CRM for social sellers';
    // Preload both theme variants so toggle is instant
    SHOT_KEYS.forEach((key) => {
      ['light', 'dark'].forEach((mode) => {
        const img = new window.Image();
        img.src = shotPath(key, mode);
      });
    });
    return () => {
      document.title = 'DokaanDM';
    };
  }, []);

  return (
    <div className="min-h-screen bg-bg text-fg">
      <LandingNav mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main>
        <Hero />
        <FeaturesSection />
        <ProductTour />
        <HowItWorks />
        <PricingSection />
        <SocialProof />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
