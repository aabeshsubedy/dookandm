import request from 'supertest';
import { createApp } from '../../src/app.js';

export const app = createApp();

/** Register a seller and return { agent, accessToken, seller }. */
export async function registerAndLogin(overrides = {}) {
  const payload = {
    fullName: 'Test Seller',
    businessName: 'Test Shop',
    email: `seller_${Math.random().toString(36).slice(2)}@example.com`,
    password: 'password123',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(payload);
  return { accessToken: res.body.data.accessToken, seller: res.body.data.seller, res };
}

export function auth(token) {
  return { Authorization: `Bearer ${token}` };
}
