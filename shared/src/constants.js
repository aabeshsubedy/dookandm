/** Shared enums & constant vocabularies used across client + server. */

export const CHANNEL_TYPES = ['facebook', 'instagram'];

export const CONVERSATION_KINDS = ['dm', 'comment'];

export const MESSAGE_DIRECTIONS = ['inbound', 'outbound'];

export const MESSAGE_STATUS = ['received', 'queued', 'sent', 'delivered', 'failed'];

export const PAYMENT_TYPES = ['cod', 'esewa', 'khalti', 'bank_transfer'];

export const PAYMENT_TYPE_LABELS = {
  cod: 'Cash on Delivery',
  esewa: 'eSewa',
  khalti: 'Khalti',
  bank_transfer: 'Bank Transfer',
};

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'returned',
  'cancelled',
];

/** Allowed status transitions (from -> [allowed to]). Enforced server-side. */
export const ORDER_STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled', 'returned'],
  shipped: ['delivered', 'returned'],
  delivered: ['returned'],
  returned: [],
  cancelled: [],
};

/** Statuses that count as a completed fulfilment for risk scoring. */
export const COMPLETED_ORDER_STATUSES = ['delivered', 'returned'];

export const RISK_LABELS = ['new', 'reliable', 'medium', 'risky'];

/**
 * COD risk scoring thresholds. Config constants — tune values without changing
 * the rule shape. The scoring function that consumes these is pure + unit-tested.
 */
export const RISK_CONFIG = {
  MIN_HISTORY: 2, // completed orders required before a customer can be scored beyond "new"
  RELIABLE_MAX_RETURN_RATE: 0.15,
  MEDIUM_MAX_RETURN_RATE: 0.35,
  RISKY_ABSOLUTE_RETURNS: 2, // >= this many returns...
  RISKY_ABSOLUTE_TOTAL: 3, // ...within <= this many total orders => risky
};

export const CUSTOMER_TAG_PRESETS = ['VIP', 'risky', 'regular', 'wholesale'];

export const PRODUCT_STATUSES = ['active', 'archived'];

/** Low-stock threshold (units) for the "running low" indicator on tracked products. */
export const LOW_STOCK_THRESHOLD = 5;

export const ACTIVITY_ACTIONS = {
  ORDER_CREATED: 'order.created',
  ORDER_STATUS_CHANGED: 'order.status_changed',
  ORDER_UPDATED: 'order.updated',
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
  CUSTOMER_NOTE_ADDED: 'customer.note_added',
  CUSTOMER_NOTE_EDITED: 'customer.note_edited',
  CHANNEL_CONNECTED: 'channel.connected',
  CHANNEL_DISCONNECTED: 'channel.disconnected',
  REMINDER_CREATED: 'reminder.created',
  REMINDER_COMPLETED: 'reminder.completed',
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_ARCHIVED: 'product.archived',
};

export const PAGINATION = {
  DEFAULT_LIMIT: 25,
  MAX_LIMIT: 100,
};
