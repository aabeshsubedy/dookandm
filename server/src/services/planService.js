import { getPlanLimits, minPlanForFeature } from '@dokaandm/shared';
import { Channel } from '../models/Channel.js';
import { Customer } from '../models/Customer.js';
import { Product } from '../models/Product.js';
import { Seller } from '../models/Seller.js';

/** Reset the monthly order counter if the rolling period has rolled over. */
export async function rollOrderPeriodIfNeeded(seller) {
  const now = new Date();
  const start = seller.orderCountPeriodStart || new Date(0);
  const monthsElapsed =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (monthsElapsed >= 1) {
    seller.orderCountThisPeriod = 0;
    seller.orderCountPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    await seller.save();
  }
  return seller;
}

/** Live usage snapshot for a tenant (for GET /plan meters + upgrade nudges). */
export async function getUsage(seller, tenantId) {
  const [channels, customers, products] = await Promise.all([
    Channel.countDocuments({ seller: tenantId, status: { $ne: 'disconnected' } }),
    Customer.countDocuments({ seller: tenantId }),
    Product.countDocuments({ seller: tenantId, status: 'active' }),
  ]);
  const teamLogins = await Seller.countDocuments({
    $or: [{ _id: tenantId }, { parentSeller: tenantId }],
    isActive: true,
  });
  return {
    channels,
    customers,
    products,
    ordersThisPeriod: seller.orderCountThisPeriod || 0,
    teamLogins,
  };
}

export function buildPlanPayload(seller, usage) {
  const limits = getPlanLimits(seller.plan);
  const serialize = (n) => (n === Infinity ? null : n); // null == unlimited over the wire
  return {
    plan: seller.plan,
    planStatus: seller.planStatus,
    label: limits.label,
    limits: {
      channels: serialize(limits.channels),
      ordersPerMonth: serialize(limits.ordersPerMonth),
      customers: serialize(limits.customers),
      products: serialize(limits.products),
      teamLogins: serialize(limits.teamLogins),
      singleChannelType: limits.singleChannelType,
    },
    features: Array.from(limits.features),
    usage,
  };
}

export { minPlanForFeature };
