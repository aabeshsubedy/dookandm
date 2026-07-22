import { Check, Sparkles, Star, Palette, CreditCard, X } from 'lucide-react';
import { Page } from '../components/layout/PageHeader.jsx';
import { ThemeSegmented, BrandColorGrid } from '../components/ui/ThemeToggle.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { usePlan, usePlanCatalog } from '../hooks/data.js';
import { cn } from '../lib/cn.js';

const featureLabels = {
  cod_risk: 'COD risk flagging',
  dashboard: 'Business dashboard',
  crm: 'CRM notes, tags & reminders',
  kanban: 'Full order pipeline (kanban)',
  csv_export: 'CSV export',
};

const USAGE_ROWS = [
  { key: 'ordersThisPeriod', limitKey: 'ordersPerMonth', label: 'Orders this month' },
  { key: 'products', limitKey: 'products', label: 'Products' },
  { key: 'customers', limitKey: 'customers', label: 'Customers' },
  { key: 'channels', limitKey: 'channels', label: 'Channels' },
  { key: 'teamLogins', limitKey: 'teamLogins', label: 'Team logins' },
];

export default function PlanPage() {
  const { data: plan, isLoading } = usePlan();
  const { data: catalog } = usePlanCatalog();

  if (isLoading) {
    return (
      <Page>
        <SettingsSkeleton />
      </Page>
    );
  }

  const tiers = catalog?.catalog || [];
  const currentTier = tiers.find((t) => t.key === plan?.plan);
  const priceLabel =
    plan?.plan === 'free'
      ? 'Free forever'
      : currentTier?.pricePerMonthNpr != null
        ? `NPR ${currentTier.pricePerMonthNpr.toLocaleString('en-NP')}/mo`
        : 'Custom pricing';

  const statusLabel = plan?.planStatus
    ? String(plan.planStatus).charAt(0).toUpperCase() + String(plan.planStatus).slice(1)
    : 'Active';

  return (
    <Page>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Settings</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Appearance, accent color, plan, and usage
          </p>
        </div>
      </header>

      <div className="mt-6 space-y-4">
        {/* Appearance */}
        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-border/70 px-5 py-3.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2 text-fg-muted">
              <Palette className="h-3.5 w-3.5" strokeWidth={1.75} />
            </span>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-fg">Appearance</h2>
              <p className="text-xs text-fg-muted">Theme and brand accent across the app</p>
            </div>
          </div>

          <div className="space-y-5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-fg">Theme</p>
                <p className="mt-0.5 text-xs text-fg-muted">Light, dark, or match your system</p>
              </div>
              <ThemeSegmented />
            </div>

            <div className="border-t border-border/70 pt-5">
              <p className="text-sm font-medium text-fg">Accent color</p>
              <p className="mt-0.5 mb-3 text-xs text-fg-muted">
                Used for buttons, links, and highlights
              </p>
              <BrandColorGrid />
            </div>
          </div>
        </section>

        {/* Current plan + usage */}
        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-border/70 px-5 py-3.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-brand">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold tracking-tight text-fg">Your plan</h2>
              <p className="text-xs text-fg-muted">Limits and live usage for this workspace</p>
            </div>
          </div>

          <div className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-bg px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-brand-fg shadow-xs">
                  <CreditCard className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-base font-semibold tracking-tight text-fg">
                    {plan?.label || 'Free'} plan
                  </p>
                  <p className="text-xs text-fg-muted">{priceLabel}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-success-soft px-2 py-0.5 text-2xs font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                {statusLabel}
              </span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {USAGE_ROWS.map((row) => (
                <UsageMeter
                  key={row.key}
                  label={row.label}
                  used={plan?.usage?.[row.key] || 0}
                  limit={plan?.limits?.[row.limitKey]}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Plan catalog */}
        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-fg">All plans</h2>
              <p className="mt-0.5 text-xs text-fg-muted">
                No transaction fees. Upgrade anytime as your shop grows.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tiers.map((t) => {
              const current = t.key === plan?.plan;
              const popular = t.key === 'starter';
              return (
                <div
                  key={t.key}
                  className={cn(
                    'relative flex flex-col rounded-2xl border bg-surface p-4 shadow-xs',
                    current
                      ? 'border-brand ring-2 ring-brand/15'
                      : 'border-border hover:border-border-strong'
                  )}
                >
                  {popular && !current && (
                    <span className="absolute -top-2.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-md bg-brand px-2 py-0.5 text-2xs font-semibold text-brand-fg">
                      <Star className="h-3 w-3" />
                      Popular
                    </span>
                  )}
                  {current && (
                    <span className="absolute -top-2.5 left-1/2 inline-flex -translate-x-1/2 items-center rounded-md bg-brand-soft px-2 py-0.5 text-2xs font-semibold text-brand">
                      Current
                    </span>
                  )}

                  <p className="text-sm font-semibold text-fg">{t.label}</p>
                  <p className="mt-1.5 text-2xl font-semibold tracking-tight text-fg">
                    {t.pricePerMonthNpr == null
                      ? 'Custom'
                      : t.pricePerMonthNpr === 0
                        ? 'Free'
                        : `NPR ${Number(t.pricePerMonthNpr).toLocaleString('en-NP')}`}
                    {t.pricePerMonthNpr > 0 && (
                      <span className="text-sm font-normal text-fg-muted">/mo</span>
                    )}
                  </p>

                  <ul className="mt-4 flex-1 space-y-2 text-xs text-fg-secondary sm:text-sm">
                    <Li>
                      {t.channels == null ? 'Unlimited' : t.channels} channel
                      {t.channels === 1 ? '' : 's'}
                    </Li>
                    <Li>
                      {t.ordersPerMonth == null ? 'Unlimited' : t.ordersPerMonth} orders / mo
                    </Li>
                    <Li>
                      {t.customers == null ? 'Unlimited' : t.customers} customers
                    </Li>
                    <Li>
                      {t.products == null ? 'Unlimited' : t.products} products
                    </Li>
                    <Li>
                      {t.teamLogins == null ? 'Unlimited' : t.teamLogins} team login
                      {t.teamLogins === 1 ? '' : 's'}
                    </Li>
                    {Object.entries(featureLabels).map(([key, label]) =>
                      t.features?.includes?.(key) ? (
                        <Li key={key}>{label}</Li>
                      ) : (
                        <li key={key} className="flex items-start gap-2 text-fg-muted">
                          <X className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-50" strokeWidth={2} />
                          <span className="line-through decoration-border-strong">{label}</span>
                        </li>
                      )
                    )}
                  </ul>

                  <div className="mt-4">
                    {current ? (
                      <span className="block rounded-lg bg-brand-soft py-2 text-center text-sm font-medium text-brand">
                        Current plan
                      </span>
                    ) : (
                      <span className="block rounded-lg border border-border py-2 text-center text-sm font-medium text-fg-muted">
                        {t.key === 'business' ? 'Contact us' : 'Upgrade'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-xs leading-relaxed text-fg-muted">
            Payment collection is not part of this MVP — plans are assigned manually for pilots.
            Zero transaction or service fees on every tier.
          </p>
        </section>
      </div>
    </Page>
  );
}

function UsageMeter({ label, used, limit }) {
  const unlimited = limit == null;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
  const danger = !unlimited && pct >= 90;
  const warn = !unlimited && pct >= 80 && !danger;

  return (
    <div className="rounded-xl border border-border bg-bg px-3 py-3">
      <div className="flex items-start justify-between gap-2 text-xs">
        <span className="text-fg-secondary">{label}</span>
        <span className="shrink-0 tabular-nums text-fg">
          <span className="font-semibold">{used}</span>
          <span className="text-fg-muted">{unlimited ? ' · unlimited' : ` / ${limit}`}</span>
        </span>
      </div>
      {!unlimited && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
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

function Li({ children }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" strokeWidth={2.5} />
      <span>{children}</span>
    </li>
  );
}

function SettingsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading settings">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="mt-2 h-4 w-56" />
      <div className="mt-6 space-y-4">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
