import mongoose from 'mongoose';
import { PAYMENT_TYPES, ORDER_STATUSES } from '@dokaandm/shared';

const orderItemSchema = new mongoose.Schema(
  {
    // Optional link to a catalog product; name/price stay snapshotted below so
    // historical orders are unaffected by later product edits.
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    sku: { type: String },
    productName: { type: String, required: true, maxlength: 200 },
    qty: { type: Number, required: true, min: 1 },
    unitPricePaisa: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    from: { type: String },
    to: { type: String, required: true },
    at: { type: Date, default: () => new Date() },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    orderNumber: { type: String, required: true }, // per-seller, e.g. DKN-000123
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
    channelType: { type: String },

    items: { type: [orderItemSchema], required: true, validate: (v) => v.length > 0 },
    subtotalPaisa: { type: Number, required: true, min: 0 },
    shippingPaisa: { type: Number, default: 0, min: 0 },
    totalPaisa: { type: Number, required: true, min: 0 },

    paymentType: { type: String, enum: PAYMENT_TYPES, default: 'cod' },
    paymentReference: { type: String, maxlength: 120 },
    phone: { type: String, required: true }, // drives identity resolution
    address: { type: String, maxlength: 500 },

    status: { type: String, enum: ORDER_STATUSES, default: 'pending' },
    statusHistory: { type: [statusHistorySchema], default: [] },
    notes: { type: String, maxlength: 2000 },
  },
  { timestamps: true }
);

orderSchema.index({ seller: 1, createdAt: -1 }); // list
orderSchema.index({ seller: 1, status: 1, createdAt: -1 }); // pipeline
orderSchema.index({ customer: 1, createdAt: -1 }); // per-customer history rollup
orderSchema.index({ seller: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ seller: 1, paymentType: 1, status: 1 }); // COD-pending dashboard card

export const Order = mongoose.model('Order', orderSchema);
