import { Check, Sparkles, Star } from 'lucide-react';
import { Page, PageHeader } from '../components/layout/PageHeader.jsx';
import { Card, CardBody } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { ThemeSegmented, BrandColorGrid } from '../components/ui/ThemeToggle.jsx';
import { LoadingPanel } from '../components/ui/Skeleton.jsx';
import { usePlan, usePlanCatalog } from '../hooks/data.js';
import { cn } from '../lib/cn.js';

const featureLabels = {
  cod_risk: 'COD risk flagging',
  dashboard: 'Business dashboard',
  crm: 'CRM notes, tags & reminders',
  kanban: 'Full order pipeline (kanban)',
  csv_export: 'CSV export',
};

function UsageMeter({ label, used, limit }) {
  const unlimited = limit == null;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const danger = pct >= 90;
  const warn = pct >= 80 && !danger;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-fg-secondary">{label}</span>
        <span className="font-medium text-fg">
          {used}
          {unlimited ? '' : ` / ${limit}`}
          {unlimited && <span className="ml-1 text-fg-muted">unlimited</span>}
        </span>
      </div>
      {!unlimited && (
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              danger ? 'bg-danger' : warn ? 'bg-warning' : 'bg-brand'
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function PlanPage() {
  const { data: plan, isLoading } = usePlan();
  const { data: catalog } = usePlanCatalog();

  if (isLoading)
    return (
      <Page>
        <LoadingPanel />
      </Page>
    );

  const tiers = catalog?.catalog || [];

  return (
    <Page>
      <PageHeader
        title="Settings"
        description="Appearance, accent colors, plan, and usage."
      />

      <Card className="mt-5">
        <CardBody className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-fg">Appearance</p>
              <p className="text-sm text-fg-muted">Light, dark, or match system.</p>
            </div>
            <ThemeSegmented />
          </div>
          <div className="border-t border-border pt-5">
            <p className="font-medium text-fg">Accent color</p>
            <p className="mb-3 text-sm text-fg-muted">
              Six brand colors for buttons, links, and highlights across the app.
            </p>
            <BrandColorGrid />
          </div>
        </CardBody>
      </Card>

      <Card className="mt-3">
        <CardBody>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand text-brand-fg">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-base font-semibold text-fg">{plan?.label} plan</p>
                <p className="text-sm text-fg-muted">
                  {plan?.plan === 'free'
                    ? 'Free forever'
                    : `NPR ${tiers.find((t) => t.key === plan?.plan)?.pricePerMonthNpr}/mo`}
                </p>
              </div>
            </div>
            <Badge tone="good" dot>
              {plan?.planStatus}
            </Badge>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <UsageMeter
              label="Orders this month"
              used={plan?.usage?.ordersThisPeriod || 0}
              limit={plan?.limits?.ordersPerMonth}
            />
            <UsageMeter
              label="Products"
              used={plan?.usage?.products || 0}
              limit={plan?.limits?.products}
            />
            <UsageMeter
              label="Customers"
              used={plan?.usage?.customers || 0}
              limit={plan?.limits?.customers}
            />
            <UsageMeter
              label="Channels"
              used={plan?.usage?.channels || 0}
              limit={plan?.limits?.channels}
            />
            <UsageMeter
              label="Team logins"
              used={plan?.usage?.teamLogins || 0}
              limit={plan?.limits?.teamLogins}
            />
          </div>
        </CardBody>
      </Card>

      <h2 className="mb-2 mt-8 text-base font-semibold text-fg">All plans</h2>
      <p className="mb-4 text-sm text-fg-muted">
        No transaction fees. Upgrade anytime as your shop grows.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((t) => {
          const current = t.key === plan?.plan;
          const popular = t.key === 'starter';
          return (
            <div
              key={t.key}
              className={cn(
                'relative flex flex-col rounded-xl border bg-surface p-4',
                current ? 'border-brand ring-1 ring-brand/30' : 'border-border'
              )}
            >
              {popular && !current && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-md bg-brand px-2 py-0.5 text-2xs font-medium text-brand-fg">
                  <Star className="mr-0.5 inline h-3 w-3" /> Popular
                </span>
              )}
              <p className="font-medium text-fg">{t.label}</p>
              <p className="mt-1 text-2xl font-semibold text-fg">
                {t.pricePerMonthNpr == null
                  ? 'Custom'
                  : t.pricePerMonthNpr === 0
                    ? 'Free'
                    : `NPR ${t.pricePerMonthNpr}`}
                {t.pricePerMonthNpr > 0 && (
                  <span className="text-sm font-normal text-fg-muted">/mo</span>
                )}
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-fg-secondary">
                <Li>
                  {t.channels == null ? 'Unlimited' : t.channels} channel
                  {t.channels === 1 ? '' : 's'}
                </Li>
                <Li>
                  {t.ordersPerMonth == null ? 'Unlimited' : t.ordersPerMonth} orders / mo
                </Li>
                <Li>{t.customers == null ? 'Unlimited' : t.customers} customers</Li>
                <Li>{t.products == null ? 'Unlimited' : t.products} products</Li>
                <Li>
                  {t.teamLogins == null ? 'Unlimited' : t.teamLogins} team login
                  {t.teamLogins === 1 ? '' : 's'}
                </Li>
                {Object.entries(featureLabels).map(([key, label]) =>
                  t.features.includes(key) ? <Li key={key}>{label}</Li> : null
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
      <p className="mt-4 text-xs text-fg-muted">
        Payment collection is not part of this MVP — plans are assigned manually for pilots.
      </p>
    </Page>
  );
}

function Li({ children }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
      <span>{children}</span>
    </li>
  );
}
