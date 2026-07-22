import { Router } from 'express';
import {
  createProductSchema,
  updateProductSchema,
  adjustStockSchema,
  ACTIVITY_ACTIONS,
  FEATURES,
  BRAND,
  LOW_STOCK_THRESHOLD,
} from '@dokaandm/shared';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { requireFeature, enforceProductQuota } from '../middleware/plan.js';
import { asyncHandler, ok, paginated, parsePagination } from '../lib/http.js';
import { ApiError } from '../lib/ApiError.js';
import { Product } from '../models/Product.js';
import { containsRegex } from '../lib/sanitize.js';
import { recordActivity } from '../services/activityService.js';

const router = Router();

const toPaisa = (npr) => Math.round(Number(npr) * 100);

/** Next per-seller sequential SKU, e.g. DKN-P-000042. Sorts by SKU (not date). */
async function nextSku(sellerId) {
  const prefix = `${BRAND.orderPrefix}-P-`;
  const last = await Product.findOne({ seller: sellerId, sku: new RegExp(`^${prefix}\\d+$`) })
    .sort({ sku: -1 })
    .select('sku')
    .lean();
  let n = 0;
  if (last?.sku) {
    const m = last.sku.match(/(\d+)$/);
    if (m) n = parseInt(m[1], 10);
  }
  return `${prefix}${String(n + 1).padStart(6, '0')}`;
}

/**
 * @openapi
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: List/search products by name or product ID (SKU)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: q, schema: { type: string }, description: matches name OR SKU }
 *       - { in: query, name: category, schema: { type: string } }
 *       - { in: query, name: status, schema: { type: string, enum: [active, archived] } }
 *       - { in: query, name: lowStock, schema: { type: string, enum: ["true"] } }
 *       - { in: query, name: page, schema: { type: integer } }
 *     responses:
 *       200: { description: Paginated products }
 */
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);
    const query = { seller: req.tenantId };

    const status = req.query.status != null ? String(req.query.status) : 'active';
    if (status === 'active' || status === 'archived') query.status = status;
    if (status === 'all') delete query.status;

    if (req.query.category) query.category = String(req.query.category);
    if (req.query.q) {
      const rx = containsRegex(req.query.q);
      query.$or = [{ name: rx }, { sku: rx }];
    }
    if (req.query.lowStock === 'true') {
      query.trackInventory = true;
      query.stock = { $lte: LOW_STOCK_THRESHOLD };
    }

    const [items, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(query),
    ]);
    return paginated(res, items, { page, limit, total });
  })
);

/**
 * @openapi
 * /products/categories:
 *   get:
 *     tags: [Products]
 *     summary: Distinct category list (for filters/autocomplete)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Category list }
 */
router.get(
  '/categories',
  requireAuth,
  asyncHandler(async (req, res) => {
    const categories = await Product.distinct('category', {
      seller: req.tenantId,
      category: { $nin: [null, ''] },
    });
    return ok(res, { categories: categories.sort() });
  })
);

/**
 * @openapi
 * /products/export.csv:
 *   get:
 *     tags: [Products]
 *     summary: Export the product catalog as CSV (paid)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: CSV file }
 */
router.get(
  '/export.csv',
  requireAuth,
  requireFeature(FEATURES.CSV_EXPORT),
  asyncHandler(async (req, res) => {
    const products = await Product.find({ seller: req.tenantId }).sort({ createdAt: -1 }).limit(5000).lean();
    const rows = [
      ['SKU', 'Name', 'Category', 'Price (NPR)', 'Cost (NPR)', 'Tracked', 'Stock', 'Units Sold', 'Status'],
      ...products.map((p) => [
        p.sku,
        p.name,
        p.category || '',
        (p.pricePaisa / 100).toFixed(2),
        p.costPaisa != null ? (p.costPaisa / 100).toFixed(2) : '',
        p.trackInventory ? 'yes' : 'no',
        p.trackInventory ? p.stock : '',
        p.stats?.unitsSold || 0,
        p.status,
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    return res.send(csv);
  })
);

/**
 * @openapi
 * /products:
 *   post:
 *     tags: [Products]
 *     summary: Create a product (quota-enforced; SKU auto-generated if omitted)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Created }
 *       403: { description: Product quota exceeded }
 *       409: { description: SKU already exists }
 */
router.post(
  '/',
  requireAuth,
  enforceProductQuota,
  validate(createProductSchema),
  asyncHandler(async (req, res) => {
    const body = req.body;
    const sku = body.sku ? body.sku : await nextSku(req.tenantId);

    const dup = await Product.findOne({ seller: req.tenantId, sku }).lean();
    if (dup) throw ApiError.conflict('A product with that ID (SKU) already exists', 'SKU_TAKEN');

    const product = await Product.create({
      seller: req.tenantId,
      name: body.name,
      sku,
      pricePaisa: toPaisa(body.priceNpr),
      costPaisa: body.costNpr != null ? toPaisa(body.costNpr) : undefined,
      category: body.category || undefined,
      description: body.description || undefined,
      imageUrl: body.imageUrl || undefined,
      trackInventory: !!body.trackInventory,
      stock: body.trackInventory ? Number(body.stock || 0) : 0,
      status: 'active',
    });

    await recordActivity({
      seller: req.tenantId,
      actor: req.seller._id,
      action: ACTIVITY_ACTIONS.PRODUCT_CREATED,
      entityType: 'Product',
      entityId: product._id,
      meta: { sku, name: product.name },
      ip: req.ip,
    });
    return ok(res, { product }, 201);
  })
);

/**
 * @openapi
 * /products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Product detail
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Product }
 *       404: { description: Not found }
 */
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id, seller: req.tenantId }).lean();
    if (!product) throw ApiError.notFound('Product not found');
    return ok(res, { product });
  })
);

/**
 * @openapi
 * /products/{id}:
 *   patch:
 *     tags: [Products]
 *     summary: Update a product
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Updated }
 *       409: { description: SKU already exists }
 */
router.patch(
  '/:id',
  requireAuth,
  validate(updateProductSchema),
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id, seller: req.tenantId });
    if (!product) throw ApiError.notFound('Product not found');
    const b = req.body;

    if (b.sku != null && b.sku !== product.sku) {
      const dup = await Product.findOne({ seller: req.tenantId, sku: b.sku, _id: { $ne: product._id } }).lean();
      if (dup) throw ApiError.conflict('A product with that ID (SKU) already exists', 'SKU_TAKEN');
      product.sku = b.sku;
    }
    if (b.name != null) product.name = b.name;
    if (b.priceNpr != null) product.pricePaisa = toPaisa(b.priceNpr);
    if (b.costNpr != null) product.costPaisa = toPaisa(b.costNpr);
    if (b.category != null) product.category = b.category || undefined;
    if (b.description != null) product.description = b.description || undefined;
    if (b.imageUrl != null) product.imageUrl = b.imageUrl || undefined;
    if (b.trackInventory != null) product.trackInventory = !!b.trackInventory;
    if (b.stock != null) product.stock = Number(b.stock);
    if (b.status != null) product.status = b.status;

    await product.save();
    await recordActivity({
      seller: req.tenantId,
      actor: req.seller._id,
      action: ACTIVITY_ACTIONS.PRODUCT_UPDATED,
      entityType: 'Product',
      entityId: product._id,
      meta: { fields: Object.keys(b) },
      ip: req.ip,
    });
    return ok(res, { product });
  })
);

/**
 * @openapi
 * /products/{id}/stock:
 *   post:
 *     tags: [Products]
 *     summary: Adjust stock by a signed delta (restock / correction)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [delta], properties: { delta: { type: integer } } }
 *     responses:
 *       200: { description: Updated stock }
 */
router.post(
  '/:id/stock',
  requireAuth,
  validate(adjustStockSchema),
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id, seller: req.tenantId });
    if (!product) throw ApiError.notFound('Product not found');
    if (!product.trackInventory) throw ApiError.badRequest('Inventory tracking is off for this product');

    const next = Math.max(0, product.stock + Number(req.body.delta));
    product.stock = next;
    await product.save();
    await recordActivity({
      seller: req.tenantId,
      actor: req.seller._id,
      action: ACTIVITY_ACTIONS.PRODUCT_UPDATED,
      entityType: 'Product',
      entityId: product._id,
      meta: { stockDelta: req.body.delta, stock: next },
      ip: req.ip,
    });
    return ok(res, { product });
  })
);

/**
 * @openapi
 * /products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Archive a product (soft delete — keeps order history intact)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Archived }
 */
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, seller: req.tenantId },
      { $set: { status: 'archived' } },
      { new: true }
    );
    if (!product) throw ApiError.notFound('Product not found');
    await recordActivity({
      seller: req.tenantId,
      actor: req.seller._id,
      action: ACTIVITY_ACTIONS.PRODUCT_ARCHIVED,
      entityType: 'Product',
      entityId: product._id,
      ip: req.ip,
    });
    return ok(res, { product });
  })
);

export default router;
