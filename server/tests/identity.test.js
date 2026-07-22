import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { connectTestDb, clearTestDb, closeTestDb } from './helpers/db.js';
import { Customer } from '../src/models/Customer.js';
import { resolveByChannelIdentity, resolveByPhone } from '../src/services/identityService.js';

const sellerA = new mongoose.Types.ObjectId();
const sellerB = new mongoose.Types.ObjectId();
const channelId = new mongoose.Types.ObjectId();

beforeAll(connectTestDb);
afterAll(closeTestDb);
beforeEach(clearTestDb);

describe('customer identity resolution (core differentiator)', () => {
  it('creates a provisional customer from a channel handle', async () => {
    const c = await resolveByChannelIdentity({
      sellerId: sellerA,
      channelId,
      channelType: 'instagram',
      externalUserId: 'ig_123',
      handle: '@ramesh',
    });
    expect(c.isProvisional).toBe(true);
    expect(c.channelIdentities[0].externalUserId).toBe('ig_123');
  });

  it('returns the same provisional customer for a repeat channel handle', async () => {
    const first = await resolveByChannelIdentity({
      sellerId: sellerA,
      channelId,
      channelType: 'instagram',
      externalUserId: 'ig_123',
    });
    const second = await resolveByChannelIdentity({
      sellerId: sellerA,
      channelId,
      channelType: 'instagram',
      externalUserId: 'ig_123',
    });
    expect(String(first._id)).toBe(String(second._id));
    expect(await Customer.countDocuments({ seller: sellerA })).toBe(1);
  });

  it('promotes a provisional customer in place when a phone arrives (no duplicate)', async () => {
    const provisional = await resolveByChannelIdentity({
      sellerId: sellerA,
      channelId,
      channelType: 'instagram',
      externalUserId: 'ig_123',
      handle: '@ramesh',
    });

    const { customer, merged } = await resolveByPhone({
      sellerId: sellerA,
      phone: '9812345678',
      name: 'Ramesh',
      conversationCustomer: provisional,
    });

    expect(merged).toBe(true);
    expect(String(customer._id)).toBe(String(provisional._id));
    expect(customer.isProvisional).toBe(false);
    expect(customer.phones).toContain('+9779812345678');
    expect(await Customer.countDocuments({ seller: sellerA })).toBe(1);
  });

  it('matches an order phone to an existing phone-keyed customer across channels', async () => {
    const existing = await Customer.create({
      seller: sellerA,
      name: 'Sita',
      phones: ['+9779800000000'],
      isProvisional: false,
    });

    const { customer, merged } = await resolveByPhone({
      sellerId: sellerA,
      phone: '9800000000',
      channelIdentity: { channel: channelId, type: 'facebook', externalUserId: 'fb_9', handle: 'Sita FB' },
    });

    expect(merged).toBe(true);
    expect(String(customer._id)).toBe(String(existing._id));
    expect(customer.channelIdentities.some((ci) => ci.externalUserId === 'fb_9')).toBe(true);
    expect(await Customer.countDocuments({ seller: sellerA })).toBe(1);
  });

  it('folds a provisional customer into the existing phone-keyed profile', async () => {
    const existing = await Customer.create({
      seller: sellerA,
      name: 'Hari',
      phones: ['+9779811111111'],
      isProvisional: false,
    });
    const provisional = await resolveByChannelIdentity({
      sellerId: sellerA,
      channelId,
      channelType: 'instagram',
      externalUserId: 'ig_hari',
    });

    const { customer } = await resolveByPhone({
      sellerId: sellerA,
      phone: '9811111111',
      conversationCustomer: provisional,
    });

    expect(String(customer._id)).toBe(String(existing._id));
    // Provisional folded in + deleted -> only one customer remains.
    expect(await Customer.countDocuments({ seller: sellerA })).toBe(1);
    const survivor = await Customer.findById(existing._id);
    expect(survivor.channelIdentities.some((ci) => ci.externalUserId === 'ig_hari')).toBe(true);
  });

  it('never resolves across tenants (isolation)', async () => {
    await Customer.create({
      seller: sellerA,
      phones: ['+9779812345678'],
      isProvisional: false,
    });
    // Seller B looks up the same phone — must get a NEW customer, not seller A's.
    const { customer, created } = await resolveByPhone({
      sellerId: sellerB,
      phone: '9812345678',
    });
    expect(created).toBe(true);
    expect(String(customer.seller)).toBe(String(sellerB));
    expect(await Customer.countDocuments({ seller: sellerA })).toBe(1);
    expect(await Customer.countDocuments({ seller: sellerB })).toBe(1);
  });
});
