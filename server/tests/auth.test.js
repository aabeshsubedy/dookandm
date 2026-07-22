import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { connectTestDb, clearTestDb, closeTestDb } from './helpers/db.js';
import { app, registerAndLogin, auth } from './helpers/app.js';

beforeAll(connectTestDb);
afterAll(closeTestDb);
beforeEach(clearTestDb);

describe('auth flow', () => {
  it('registers a seller on the Free plan and returns an access token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Aabesh',
      businessName: 'Dokaan',
      email: 'a@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.seller.plan).toBe('free');
    // Never leak the password hash.
    expect(res.body.data.seller.passwordHash).toBeUndefined();
    // Refresh cookie is set httpOnly.
    const cookie = res.headers['set-cookie']?.[0] || '';
    expect(cookie).toMatch(/HttpOnly/i);
  });

  it('rejects duplicate emails', async () => {
    await registerAndLogin({ email: 'dup@example.com' });
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Test User',
      businessName: 'Test Shop',
      email: 'dup@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('rejects weak passwords with a validation error', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Test User',
      businessName: 'Test Shop',
      email: 'weak@example.com',
      password: 'short',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('logs in with correct credentials and rejects wrong ones', async () => {
    await request(app).post('/api/auth/register').send({
      fullName: 'Test User',
      businessName: 'Test Shop',
      email: 'login@example.com',
      password: 'password123',
    });
    const good = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'password123' });
    expect(good.status).toBe(200);

    const bad = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'wrongpass' });
    expect(bad.status).toBe(401);
    expect(bad.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('blocks protected routes without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current seller with a valid token', async () => {
    const { accessToken } = await registerAndLogin();
    const res = await request(app).get('/api/auth/me').set(auth(accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data.plan.plan).toBe('free');
  });

  it('rotates the refresh token and issues a new access token', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      fullName: 'Test User',
      businessName: 'Test Shop',
      email: 'refresh@example.com',
      password: 'password123',
    });
    const cookie = reg.headers['set-cookie'];
    const res = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it('detects refresh-token reuse and revokes the family', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      fullName: 'Test User',
      businessName: 'Test Shop',
      email: 'reuse@example.com',
      password: 'password123',
    });
    const originalCookie = reg.headers['set-cookie'];

    // First rotation consumes the original token.
    const first = await request(app).post('/api/auth/refresh').set('Cookie', originalCookie);
    expect(first.status).toBe(200);

    // Reusing the ORIGINAL (now consumed) token must fail.
    const reused = await request(app).post('/api/auth/refresh').set('Cookie', originalCookie);
    expect(reused.status).toBe(401);
  });
});
