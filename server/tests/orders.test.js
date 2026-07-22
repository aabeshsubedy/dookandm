import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { connectTestDb, clearTestDb, closeTestDb } from './helpers/db.js';
import { app, registerAndLogin, auth } from './helpers/app.js';
import { Seller } from '../src/models/Seller.js';
import { Customer } from '../src/models/Customer.js';

beforeAll(connectTestDb);
afterAll(closeTestDb);
beforeEach(clearTestDb);

const sampleOrder = {
  items: [{ productName: 'Kurta', qty: 2, unitPriceNpr: 1200 }],
  phone: '9812345678',
  customerName: 'Gita',
  address: 'Kathmandu',
  paymentType: 'cod',
  shippingNpr: 100,
};

describe('order creation + pipeline', () => {
  it('creates an order, resolves the customer by phone, and computes totals', async () => {
    const { accessToken } = await registerAndLogin();
    const res = await request(app).post('/api/orders').set(auth(accessToken)).send(sampleOrder);
    expect(res.status).toBe(201);
    const order = res.body.data.order;
    expect(order.orderNumber).toMatch(/^DKN-\d{6}$/);
    // 2 * 1200 = 2400 subtotal + 100 shipping = 2500 -> paisa
    expect(order.subtotalPaisa).toBe(240000);
    expect(order.totalPaisa).toBe(250000);
    expect(order.status).toBe('pending');

    const customer = await Customer.findById(order.customer);
    expect(customer.phones).toContain('+9779812345678');
  });

  it('increments the monthly order counter', async () => {
    const { accessToken, seller } = await registerAndLogin();
    await request(app).post('/api/orders').set(auth(accessToken)).send(sampleOrder);
    const updated = await Seller.findById(seller._id);
    expect(updated.orderCountThisPeriod).toBe(1);
  });

  it('enforces the Free monthly order quota (40)', async () => {
    const { accessToken, seller } = await registerAndLogin();
    // Simulate having already hit the cap.
    await Seller.updateOne({ _id: seller._id }, { $set: { orderCountThisPeriod: 40 } });
    const res = await request(app).post('/api/orders').set(auth(accessToken)).send(sampleOrder);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('PLAN_QUOTA_EXCEEDED');
  });

  it('validates status transitions (rejects illegal jumps)', async () => {
    const { accessToken } = await registerAndLogin();
    const created = await request(app).post('/api/orders').set(auth(accessToken)).send(sampleOrder);
    const id = created.body.data.order._id;

    // pending -> delivered is illegal.
    const bad = await request(app)
      .patch(`/api/orders/${id}/status`)
      .set(auth(accessToken))
      .send({ status: 'delivered' });
    expect(bad.status).toBe(400);

    // pending -> confirmed is legal.
    const good = await request(app)
      .patch(`/api/orders/${id}/status`)
      .set(auth(accessToken))
      .send({ status: 'confirmed' });
    expect(good.status).toBe(200);
    expect(good.body.data.order.status).toBe('confirmed');
    expect(good.body.data.order.statusHistory.length).toBe(2);
  });

  it('rolls up returned orders into the customer risk cache', async () => {
    const { accessToken } = await registerAndLogin();
    // Two delivered + one returned for the same phone.
    for (let i = 0; i < 2; i += 1) {
      const c = await request(app).post('/api/orders').set(auth(accessToken)).send(sampleOrder);
      const id = c.body.data.order._id;
      await request(app).patch(`/api/orders/${id}/status`).set(auth(accessToken)).send({ status: 'confirmed' });
      await request(app).patch(`/api/orders/${id}/status`).set(auth(accessToken)).send({ status: 'shipped' });
      await request(app).patch(`/api/orders/${id}/status`).set(auth(accessToken)).send({ status: 'delivered' });
    }
    const r = await request(app).post('/api/orders').set(auth(accessToken)).send(sampleOrder);
    const rid = r.body.data.order._id;
    await request(app).patch(`/api/orders/${rid}/status`).set(auth(accessToken)).send({ status: 'confirmed' });
    await request(app).patch(`/api/orders/${rid}/status`).set(auth(accessToken)).send({ status: 'returned' });

    const customer = await Customer.findOne({ phones: '+9779812345678' });
    expect(customer.riskCache.deliveredOrders).toBe(2);
    expect(customer.riskCache.returnedOrders).toBe(1);
    // 1/3 = 0.333 -> medium
    expect(customer.riskCache.label).toBe('medium');
  });
});
