import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { connectTestDb, clearTestDb, closeTestDb } from './helpers/db.js';
import { app, registerAndLogin, auth } from './helpers/app.js';
import { Product } from '../src/models/Product.js';

beforeAll(connectTestDb);
afterAll(closeTestDb);
beforeEach(clearTestDb);

const sample = { name: 'Cotton Kurta', priceNpr: 1400, category: 'Apparel' };

describe('products CRUD + search', () => {
  it('creates a product and auto-generates a SKU', async () => {
    const { accessToken } = await registerAndLogin();
    const res = await request(app).post('/api/products').set(auth(accessToken)).send(sample);
    expect(res.status).toBe(201);
    expect(res.body.data.product.sku).toMatch(/^DKN-P-\d{6}$/);
    expect(res.body.data.product.pricePaisa).toBe(140000);
  });

  it('accepts a custom SKU and rejects duplicates', async () => {
    const { accessToken } = await registerAndLogin();
    const first = await request(app)
      .post('/api/products')
      .set(auth(accessToken))
      .send({ ...sample, sku: 'KURTA-01' });
    expect(first.status).toBe(201);
    expect(first.body.data.product.sku).toBe('KURTA-01');

    const dup = await request(app)
      .post('/api/products')
      .set(auth(accessToken))
      .send({ ...sample, sku: 'KURTA-01' });
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('SKU_TAKEN');
  });

  it('searches by product name and by SKU', async () => {
    const { accessToken } = await registerAndLogin();
    await request(app).post('/api/products').set(auth(accessToken)).send({ ...sample, sku: 'KRT-9' });
    await request(app)
      .post('/api/products')
      .set(auth(accessToken))
      .send({ name: 'Pashmina Shawl', priceNpr: 3200, sku: 'PSH-1' });

    const byName = await request(app).get('/api/products?q=Pashmina').set(auth(accessToken));
    expect(byName.body.data.length).toBe(1);
    expect(byName.body.data[0].name).toBe('Pashmina Shawl');

    const bySku = await request(app).get('/api/products?q=KRT-9').set(auth(accessToken));
    expect(bySku.body.data.length).toBe(1);
    expect(bySku.body.data[0].sku).toBe('KRT-9');
  });

  it('archives a product (soft delete) instead of removing it', async () => {
    const { accessToken } = await registerAndLogin();
    const created = await request(app).post('/api/products').set(auth(accessToken)).send(sample);
    const id = created.body.data.product._id;

    const del = await request(app).delete(`/api/products/${id}`).set(auth(accessToken));
    expect(del.status).toBe(200);
    expect(del.body.data.product.status).toBe('archived');

    // Default list (active only) hides it; still exists in the DB.
    const list = await request(app).get('/api/products').set(auth(accessToken));
    expect(list.body.data.length).toBe(0);
    expect(await Product.countDocuments({})).toBe(1);
  });

  it('adjusts stock by a signed delta and never goes below zero', async () => {
    const { accessToken } = await registerAndLogin();
    const created = await request(app)
      .post('/api/products')
      .set(auth(accessToken))
      .send({ ...sample, trackInventory: true, stock: 5 });
    const id = created.body.data.product._id;

    const restock = await request(app).post(`/api/products/${id}/stock`).set(auth(accessToken)).send({ delta: 10 });
    expect(restock.body.data.product.stock).toBe(15);

    const oversell = await request(app).post(`/api/products/${id}/stock`).set(auth(accessToken)).send({ delta: -100 });
    expect(oversell.body.data.product.stock).toBe(0);
  });
});

describe('product quota (Free = 25)', () => {
  it('blocks creating past the plan limit', async () => {
    const { accessToken, seller } = await registerAndLogin();
    // Pre-fill 25 active products directly, then attempt one more via API.
    const docs = Array.from({ length: 25 }, (_, i) => ({
      seller: seller._id,
      name: `P${i}`,
      sku: `SKU-${i}`,
      pricePaisa: 1000,
      status: 'active',
    }));
    await Product.insertMany(docs);

    const res = await request(app).post('/api/products').set(auth(accessToken)).send(sample);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('PLAN_QUOTA_EXCEEDED');
  });
});

describe('order ↔ product integration', () => {
  it('links a product, snapshots its SKU, decrements stock, and rolls up units sold', async () => {
    const { accessToken, seller } = await registerAndLogin();
    const created = await request(app)
      .post('/api/products')
      .set(auth(accessToken))
      .send({ name: 'Dhaka Topi', priceNpr: 800, trackInventory: true, stock: 10 });
    const product = created.body.data.product;

    const orderRes = await request(app)
      .post('/api/orders')
      .set(auth(accessToken))
      .send({
        items: [{ productId: product._id, productName: product.name, qty: 3, unitPriceNpr: 800 }],
        phone: '9812345678',
        paymentType: 'cod',
      });
    expect(orderRes.status).toBe(201);
    expect(orderRes.body.data.order.items[0].sku).toBe(product.sku);
    expect(String(orderRes.body.data.order.items[0].product)).toBe(product._id);

    const after = await Product.findById(product._id);
    expect(after.stock).toBe(7); // 10 - 3
    expect(after.stats.unitsSold).toBe(3);
    expect(after.stats.revenuePaisa).toBe(240000); // 3 * 800 * 100

    // Cross-tenant safety sanity: another seller cannot see this product.
    const other = await registerAndLogin({ email: 'other-prod@example.com' });
    const list = await request(app).get('/api/products').set(auth(other.accessToken));
    expect(list.body.data.length).toBe(0);
    // suppress unused
    expect(String(seller._id)).toBeTruthy();
  });
});
