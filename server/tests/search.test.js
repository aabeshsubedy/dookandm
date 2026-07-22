import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { connectTestDb, clearTestDb, closeTestDb } from './helpers/db.js';
import { app, registerAndLogin, auth } from './helpers/app.js';

beforeAll(connectTestDb);
afterAll(closeTestDb);
beforeEach(clearTestDb);

/**
 * Regression guard: global `sanitizeFilter` must not break our intentional
 * $regex search filters (they are wrapped in mongoose.trusted()).
 */
describe('search endpoints (regex filters + sanitizeFilter)', () => {
  it('searches customers by name and phone without a cast error', async () => {
    const { accessToken } = await registerAndLogin();
    await request(app)
      .post('/api/orders')
      .set(auth(accessToken))
      .send({
        items: [{ productName: 'Kurta', qty: 1, unitPriceNpr: 500 }],
        phone: '9812345678',
        customerName: 'Bikash Thapa',
        paymentType: 'cod',
      });

    const byName = await request(app).get('/api/customers?q=Bikash').set(auth(accessToken));
    expect(byName.status).toBe(200);
    expect(byName.body.data.length).toBe(1);

    const byPhone = await request(app).get('/api/customers?q=9812345678').set(auth(accessToken));
    expect(byPhone.status).toBe(200);
    expect(byPhone.body.data.length).toBe(1);
  });

  it('searches orders by order number without a cast error', async () => {
    const { accessToken } = await registerAndLogin();
    const created = await request(app)
      .post('/api/orders')
      .set(auth(accessToken))
      .send({ items: [{ productName: 'Bag', qty: 1, unitPriceNpr: 500 }], phone: '9800000000', paymentType: 'cod' });
    const num = created.body.data.order.orderNumber;

    const res = await request(app).get(`/api/orders?q=${num}`).set(auth(accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  it('escapes regex metacharacters in search input', async () => {
    const { accessToken } = await registerAndLogin();
    // A malicious/odd query must not error or match everything.
    const res = await request(app).get('/api/customers?q=.*').set(auth(accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });
});
