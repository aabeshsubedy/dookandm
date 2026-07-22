/**
 * Pricing tiers & limits (from pricing_plan.md).
 * Payment collection is out of MVP scope — these limits are enforced purely at
 * the data/API layer via middleware. `Infinity` means unlimited.
 */

export const PLANS = ['free', 'starter', 'growth', 'business'];

/** Feature flags gated per plan. */
export const FEATURES = {
  COD_RISK: 'cod_risk',
  DASHBOARD: 'dashboard',
  CRM: 'crm', // notes / tags / reminders
  KANBAN: 'kanban', // full pipeline board + filters (vs. basic list)
  CSV_EXPORT: 'csv_export',
};

export const PLAN_LIMITS = {
  free: {
    label: 'Free',
    pricePerMonthNpr: 0,
    channels: 1,
    // Free is a single channel of EITHER type (not both together)
    singleChannelType: true,
    ordersPerMonth: 40,
    customers: 25,
    products: 25,
    teamLogins: 1,
    features: new Set([]),
    support: 'Community, 48–72h',
  },
  starter: {
    label: 'Starter',
    pricePerMonthNpr: 899,
    pricePerYearNpr: 8990,
    channels: 2, // FB + IG together
    singleChannelType: false,
    ordersPerMonth: 300,
    customers: 500,
    products: 300,
    teamLogins: 1,
    features: new Set([
      FEATURES.COD_RISK,
      FEATURES.DASHBOARD,
      FEATURES.CRM,
      FEATURES.KANBAN,
      FEATURES.CSV_EXPORT,
    ]),
    support: 'Email, 24–48h',
  },
  growth: {
    label: 'Growth',
    pricePerMonthNpr: 1799,
    pricePerYearNpr: 17990,
    channels: 3,
    singleChannelType: false,
    ordersPerMonth: 1500,
    customers: Infinity,
    products: 2000,
    teamLogins: 3,
    features: new Set([
      FEATURES.COD_RISK,
      FEATURES.DASHBOARD,
      FEATURES.CRM,
      FEATURES.KANBAN,
      FEATURES.CSV_EXPORT,
    ]),
    support: 'Priority, same-day',
  },
  business: {
    label: 'Business',
    pricePerMonthNpr: null, // custom
    channels: Infinity,
    singleChannelType: false,
    ordersPerMonth: Infinity,
    customers: Infinity,
    products: Infinity,
    teamLogins: Infinity,
    features: new Set([
      FEATURES.COD_RISK,
      FEATURES.DASHBOARD,
      FEATURES.CRM,
      FEATURES.KANBAN,
      FEATURES.CSV_EXPORT,
    ]),
    support: 'Dedicated',
  },
};

/** Fail-safe: unknown/missing plan is treated as Free. */
export function getPlanLimits(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

export function planHasFeature(plan, feature) {
  return getPlanLimits(plan).features.has(feature);
}

/** Smallest plan that unlocks a given feature (for upgrade prompts). */
export function minPlanForFeature(feature) {
  for (const plan of PLANS) {
    if (getPlanLimits(plan).features.has(feature)) return plan;
  }
  return null;
}
