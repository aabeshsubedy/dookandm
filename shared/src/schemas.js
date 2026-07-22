import { z } from 'zod';
import {
  CHANNEL_TYPES,
  PAYMENT_TYPES,
  ORDER_STATUSES,
  CONVERSATION_KINDS,
} from './constants.js';

/* ----------------------------- Auth ----------------------------- */

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required').max(120),
  businessName: z.string().trim().min(2, 'Business name is required').max(120),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

/* --------------------------- Customers -------------------------- */

export const createCustomerSchema = z.object({
  name: z.string().trim().max(120).optional(),
  phone: z.string().trim().min(7, 'A valid phone is required').max(30),
  tags: z.array(z.string().trim().max(40)).max(20).optional(),
  note: z.string().trim().max(2000).optional(),
});

export const updateCustomerSchema = z
  .object({
    name: z.string().trim().max(120).optional(),
    phones: z.array(z.string().trim().max(30)).max(10).optional(),
    tags: z.array(z.string().trim().max(40)).max(20).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' });

export const noteSchema = z.object({
  body: z.string().trim().min(1, 'Note cannot be empty').max(2000),
});

/* ---------------------------- Orders ---------------------------- */

export const orderItemSchema = z.object({
  productName: z.string().trim().min(1, 'Product name is required').max(200),
  qty: z.coerce.number().int().min(1).max(100000),
  unitPriceNpr: z.coerce.number().min(0).max(100000000),
});

export const createOrderSchema = z.object({
  conversationId: z.string().trim().optional(),
  customerId: z.string().trim().optional(),
  items: z.array(orderItemSchema).min(1, 'Add at least one item'),
  phone: z.string().trim().min(7, 'Customer phone is required').max(30),
  customerName: z.string().trim().max(120).optional(),
  address: z.string().trim().max(500).optional(),
  paymentType: z.enum(PAYMENT_TYPES).default('cod'),
  paymentReference: z.string().trim().max(120).optional(),
  shippingNpr: z.coerce.number().min(0).max(100000000).default(0),
  notes: z.string().trim().max(2000).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export const updateOrderSchema = z
  .object({
    items: z.array(orderItemSchema).min(1).optional(),
    address: z.string().trim().max(500).optional(),
    paymentType: z.enum(PAYMENT_TYPES).optional(),
    paymentReference: z.string().trim().max(120).optional(),
    shippingNpr: z.coerce.number().min(0).optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' });

/* -------------------------- Reminders --------------------------- */

export const createReminderSchema = z.object({
  title: z.string().trim().min(1, 'Reminder title is required').max(200),
  dueAt: z.coerce.date(),
  customerId: z.string().trim().optional(),
});

export const updateReminderSchema = z
  .object({
    title: z.string().trim().max(200).optional(),
    dueAt: z.coerce.date().optional(),
    status: z.enum(['open', 'done']).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' });

/* --------------------------- Messaging -------------------------- */

export const sendMessageSchema = z.object({
  text: z.string().trim().min(1, 'Message cannot be empty').max(4000),
});

/* ---------------------------- Filters --------------------------- */

export const conversationFilterSchema = z.object({
  channelType: z.enum(CHANNEL_TYPES).optional(),
  kind: z.enum(CONVERSATION_KINDS).optional(),
  unread: z.enum(['true', 'false']).optional(),
  hasOrder: z.enum(['true', 'false']).optional(),
  q: z.string().trim().max(120).optional(),
});
