import { scoreCodRisk } from '@dokaandm/shared';
import { Order } from '../models/Order.js';
import { Customer } from '../models/Customer.js';

/**
 * Compute a customer's COD risk + rollup stats from the seller's own orders.
 * Returns the risk object (see scoreCodRisk) plus stats. Tenant-scoped.
 */
export async function computeCustomerRisk(sellerId, customerId) {
  const orders = await Order.find({ seller: sellerId, customer: customerId }).select(
    'status totalPaisa createdAt'
  );

  let delivered = 0;
  let returned = 0;
  let lifetimeValuePaisa = 0;
  let lastOrderAt = null;

  for (const o of orders) {
    if (o.status === 'delivered') {
      delivered += 1;
      lifetimeValuePaisa += o.totalPaisa;
    } else if (o.status === 'returned') {
      returned += 1;
    }
    if (!lastOrderAt || o.createdAt > lastOrderAt) lastOrderAt = o.createdAt;
  }

  const risk = scoreCodRisk({ deliveredOrders: delivered, returnedOrders: returned });
  const stats = {
    totalOrders: orders.length,
    lifetimeValuePaisa,
    lastOrderAt,
  };
  return { risk, stats };
}

/** Recompute and persist the denormalized riskCache + stats on the customer. */
export async function refreshCustomerRisk(sellerId, customerId) {
  const { risk, stats } = await computeCustomerRisk(sellerId, customerId);
  await Customer.updateOne(
    { _id: customerId, seller: sellerId },
    {
      $set: {
        riskCache: { ...risk, computedAt: new Date() },
        stats,
      },
    }
  );
  return { risk, stats };
}
