import { getPlanLimits, planHasFeature, minPlanForFeature } from '@dokaandm/shared';
import { ApiError } from '../lib/ApiError.js';
import { asyncHandler } from '../lib/http.js';
import { Channel } from '../models/Channel.js';
import { Customer } from '../models/Customer.js';
import { Product } from '../models/Product.js';
import { rollOrderPeriodIfNeeded } from '../services/planService.js';

/** Gate a route behind a plan feature flag. */
export function requireFeature(feature) {
  return (req, _res, next) => {
    if (!planHasFeature(req.seller.plan, feature)) {
      return next(
        ApiError.forbidden('Your plan does not include this feature.', 'PLAN_FEATURE_LOCKED', {
          feature,
          requiredPlan: minPlanForFeature(feature),
          currentPlan: req.seller.plan,
        })
      );
    }
    next();
  };
}

/** Enforce the monthly order-creation quota. */
export const enforceOrderQuota = asyncHandler(async (req, _res, next) => {
  const seller = await rollOrderPeriodIfNeeded(req.seller);
  const limit = getPlanLimits(seller.plan).ordersPerMonth;
  if (limit !== Infinity && seller.orderCountThisPeriod >= limit) {
    throw ApiError.forbidden(
      `You have reached your monthly order limit (${limit}). Upgrade to add more.`,
      'PLAN_QUOTA_EXCEEDED',
      { resource: 'orders', limit, used: seller.orderCountThisPeriod }
    );
  }
  next();
});

/** Enforce the customer-profile cap (manual creation path). */
export const enforceCustomerQuota = asyncHandler(async (req, _res, next) => {
  const limit = getPlanLimits(req.seller.plan).customers;
  if (limit === Infinity) return next();
  const count = await Customer.countDocuments({ seller: req.tenantId });
  if (count >= limit) {
    throw ApiError.forbidden(
      `You have reached your customer profile limit (${limit}). Upgrade to add more.`,
      'PLAN_QUOTA_EXCEEDED',
      { resource: 'customers', limit, used: count }
    );
  }
  next();
});

/** Enforce the product-catalog cap. */
export const enforceProductQuota = asyncHandler(async (req, _res, next) => {
  const limit = getPlanLimits(req.seller.plan).products;
  if (limit === Infinity) return next();
  const count = await Product.countDocuments({ seller: req.tenantId, status: 'active' });
  if (count >= limit) {
    throw ApiError.forbidden(
      `You have reached your product limit (${limit}). Upgrade to add more.`,
      'PLAN_QUOTA_EXCEEDED',
      { resource: 'products', limit, used: count }
    );
  }
  next();
});

/** Enforce the channel connection cap + Free single-type restriction. */
export const enforceChannelQuota = asyncHandler(async (req, _res, next) => {
  const limits = getPlanLimits(req.seller.plan);
  const active = await Channel.find({
    seller: req.tenantId,
    status: { $ne: 'disconnected' },
  }).select('type');

  if (limits.channels !== Infinity && active.length >= limits.channels) {
    throw ApiError.forbidden(
      `Your plan allows ${limits.channels} channel(s). Upgrade to connect more.`,
      'PLAN_QUOTA_EXCEEDED',
      { resource: 'channels', limit: limits.channels, used: active.length }
    );
  }
  req.planChannelContext = { limits, activeTypes: active.map((c) => c.type) };
  next();
});
