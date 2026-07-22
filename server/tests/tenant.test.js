import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { connectTestDb, clearTestDb, closeTestDb } from './helpers/db.js';
import { app, registerAndLogin, auth } from './helpers/app.js';

beforeAll(connectTestDb);
afterAll(closeTestDb);
beforeEach(clearTestDb);

const order = {
  items: [{ productName: 'Bag', qty: 1, unitPriceNpr: 500 }],
  phone: '9800000000',
  paymentType: 'cod',
};

describe('multi-tenant data isolation', () => {
  it("seller B cannot read seller A's order by id", async () => {
    const a = await registerAndLogin({ email: 'a-iso@example.com' });
    const b = await registerAndLogin({ email: 'b-iso@example.com' });

    const created = await request(app).post('/api/orders').set(auth(a.accessToken)).send(order);
    const orderId = created.body.data.order._id;

    const asA = await request(app).get(`/api/orders/${orderId}`).set(auth(a.accessToken));
    expect(asA.status).toBe(200);

    const asB = await request(app).get(`/api/orders/${orderId}`).set(auth(b.accessToken));
    expect(asB.status).toBe(404); // not "403" — B must not even learn it exists
  });

  it("seller B cannot change seller A's order status", async () => {
    const a = await registerAndLogin({ email: 'a2-iso@example.com' });
    const b = await registerAndLogin({ email: 'b2-iso@example.com' });

    const created = await request(app).post('/api/orders').set(auth(a.accessToken)).send(order);
    const orderId = created.body.data.order._id;

    const res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set(auth(b.accessToken))
      .send({ status: 'confirmed' });
    expect(res.status).toBe(404);
  });

  it("seller B's order list never contains seller A's orders", async () => {
    const a = await registerAndLogin({ email: 'a3-iso@example.com' });
    const b = await registerAndLogin({ email: 'b3-iso@example.com' });

    await request(app).post('/api/orders').set(auth(a.accessToken)).send(order);

    const listB = await request(app).get('/api/orders').set(auth(b.accessToken));
    expect(listB.status).toBe(200);
    expect(listB.body.data.length).toBe(0);

    const listA = await request(app).get('/api/orders').set(auth(a.accessToken));
    expect(listA.body.data.length).toBe(1);
  });

  it("seller B cannot read seller A's customers", async () => {
    const a = await registerAndLogin({ email: 'a4-iso@example.com' });
    const b = await registerAndLogin({ email: 'b4-iso@example.com' });

    await request(app).post('/api/orders').set(auth(a.accessToken)).send(order);

    const customersB = await request(app).get('/api/customers').set(auth(b.accessToken));
    expect(customersB.body.data.length).toBe(0);
  });
});
