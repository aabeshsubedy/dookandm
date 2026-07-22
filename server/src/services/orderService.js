import mongoose from 'mongoose';
import {
  ORDER_STATUS_TRANSITIONS,
  ACTIVITY_ACTIONS,
  BRAND,
  normalizePhone,
} from '@dokaandm/shared';
import { Order } from '../models/Order.js';
import { Conversation } from '../models/Conversation.js';
import { Seller } from '../models/Seller.js';
import { ApiError } from '../lib/ApiError.js';
import { resolveByPhone } from './identityService.js';
import { refreshCustomerRisk } from './riskService.js';
import { recordActivity } from './activityService.js';
import { publish } from './realtime.js';

const toPaisa = (npr) => Math.round(Number(npr) * 100);

/** Generate the next per-seller sequential order number, e.g. DKN-000042. */
async function nextOrderNumber(sellerId) {
  const last = await Order.findOne({ seller: sellerId })
    .sort({ createdAt: -1 })
    .select('orderNumber')
    .lean();
  let n = 0;
  if (last?.orderNumber) {
    const m = last.orderNumber.match(/(\d+)$/);
    if (m) n = parseInt(m[1], 10);
  }
  return `${BRAND.orderPrefix}-${String(n + 1).padStart(6, '0')}`;
}

/**
 * Create an order from a conversation (or manually). Resolves the customer by
 * phone (identity resolution), links the conversation, increments the seller's
 * monthly order counter, refreshes risk, and audit-logs.
 */
export async function createOrder({ seller, tenantId, input, ip }) {
  const normalizedPhone = normalizePhone(input.phone);
  if (!normalizedPhone) throw ApiError.badRequest('A valid customer phone is required');

  // Link source conversation (tenant-scoped) if provided.
  let conversation = null;
  let conversationCustomer = null;
  let channelType;
  if (input.conversationId && mongoose.isValidObjectId(input.conversationId)) {
    conversation = await Conversation.findOne({ _id: input.conversationId, seller: tenantId });
    if (conversation) {
      channelType = conversation.channelType;
      if (conversation.customer) {
        const { Customer } = await import('../models/Customer.js');
        conversationCustomer = await Customer.findOne({
          _id: conversation.customer,
          seller: tenantId,
        });
      }
    }
  }

  const channelIdentity =
    conversation && conversation.participantExternalId
      ? {
          channel: conversation.channel,
          type: conversation.channelType,
          externalUserId: conversation.participantExternalId,
          handle: conversation.participantHandle,
        }
      : null;

  const { customer } = await resolveByPhone({
    sellerId: tenantId,
    phone: input.phone,
    name: input.customerName,
    conversationCustomer,
    channelIdentity,
  });

  const items = input.items.map((it) => ({
    productName: it.productName,
    qty: it.qty,
    unitPricePaisa: toPaisa(it.unitPriceNpr),
  }));
  const subtotalPaisa = items.reduce((sum, it) => sum + it.unitPricePaisa * it.qty, 0);
  const shippingPaisa = toPaisa(input.shippingNpr || 0);
  const totalPaisa = subtotalPaisa + shippingPaisa;

  const orderNumber = await nextOrderNumber(tenantId);

  const order = await Order.create({
    seller: tenantId,
    orderNumber,
    customer: customer._id,
    conversation: conversation?._id,
    channelType: channelType || conversation?.channelType,
    items,
    subtotalPaisa,
    shippingPaisa,
    totalPaisa,
    paymentType: input.paymentType,
    paymentReference: input.paymentReference,
    phone: normalizedPhone,
    address: input.address,
    status: 'pending',
    statusHistory: [{ to: 'pending', at: new Date(), by: seller._id }],
    notes: input.notes,
  });

  // Increment the monthly quota counter atomically.
  await Seller.updateOne({ _id: tenantId }, { $inc: { orderCountThisPeriod: 1 } });

  if (conversation && !conversation.hasOrder) {
    conversation.hasOrder = true;
    if (!conversation.customer) conversation.customer = customer._id;
    await conversation.save();
  }

  await refreshCustomerRisk(tenantId, customer._id);

  await recordActivity({
    seller: tenantId,
    actor: seller._id,
    action: ACTIVITY_ACTIONS.ORDER_CREATED,
    entityType: 'Order',
    entityId: order._id,
    meta: { orderNumber, totalPaisa },
    ip,
  });

  publish(tenantId, 'order.created', { orderId: String(order._id), orderNumber });
  return order;
}

/** Validate + apply an order status transition. */
export async function changeOrderStatus({ seller, tenantId, orderId, nextStatus, ip }) {
  const order = await Order.findOne({ _id: orderId, seller: tenantId });
  if (!order) throw ApiError.notFound('Order not found');

  const from = order.status;
  if (from === nextStatus) return order;

  const allowed = ORDER_STATUS_TRANSITIONS[from] || [];
  if (!allowed.includes(nextStatus)) {
    throw ApiError.badRequest(
      `Cannot move an order from "${from}" to "${nextStatus}".`,
      { from, to: nextStatus, allowed }
    );
  }

  order.status = nextStatus;
  order.statusHistory.push({ from, to: nextStatus, at: new Date(), by: seller._id });
  await order.save();

  // Delivered/returned affect risk — recompute.
  await refreshCustomerRisk(tenantId, order.customer);

  await recordActivity({
    seller: tenantId,
    actor: seller._id,
    action: ACTIVITY_ACTIONS.ORDER_STATUS_CHANGED,
    entityType: 'Order',
    entityId: order._id,
    meta: { from, to: nextStatus },
    ip,
  });

  publish(tenantId, 'order.updated', { orderId: String(order._id), status: nextStatus });
  return order;
}
