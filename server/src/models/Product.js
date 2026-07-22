import mongoose from 'mongoose';
import { PRODUCT_STATUSES } from '@dokaandm/shared';

const productSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    // Human-facing product ID / stock-keeping unit — unique per seller.
    sku: { type: String, required: true, trim: true, maxlength: 60 },
    pricePaisa: { type: Number, required: true, min: 0 },
    costPaisa: { type: Number, min: 0 }, // optional, for margin insight
    category: { type: String, trim: true, maxlength: 80 },
    description: { type: String, maxlength: 2000 },
    imageUrl: { type: String, maxlength: 500 },

    // Inventory is opt-in per product. When off, stock is ignored (unlimited).
    trackInventory: { type: Boolean, default: false },
    stock: { type: Number, default: 0, min: 0 },

    status: { type: String, enum: PRODUCT_STATUSES, default: 'active' },

    // Denormalized sales rollups (incremented at order capture).
    stats: {
      unitsSold: { type: Number, default: 0 },
      revenuePaisa: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// SKU is unique within a seller's catalog (the "search by product ID" key).
productSchema.index({ seller: 1, sku: 1 }, { unique: true });
productSchema.index({ seller: 1, status: 1, createdAt: -1 });
productSchema.index({ seller: 1, name: 'text' });
productSchema.index({ seller: 1, category: 1 });

export const Product = mongoose.model('Product', productSchema);
