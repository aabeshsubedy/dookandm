import { normalizePhone } from '@dokaandm/shared';
import { Customer } from '../models/Customer.js';

/**
 * Customer identity resolution — a CORE DIFFERENTIATOR, unit-tested.
 *
 * Primary key: normalized phone number, scoped to the seller (tenant).
 * Secondary keys: channel handles (IG user id / FB PSID).
 *
 * All functions take an explicit `sellerId` (the tenant) and NEVER cross tenants.
 */

/**
 * Resolve or create a customer from a webhook conversation participant, before
 * any phone is known. Keyed on the channel external user id → provisional customer.
 */
export async function resolveByChannelIdentity({
  sellerId,
  channelId,
  channelType,
  externalUserId,
  handle,
}) {
  if (externalUserId) {
    const existing = await Customer.findOne({
      seller: sellerId,
      'channelIdentities.externalUserId': externalUserId,
    });
    if (existing) return existing;
  }

  return Customer.create({
    seller: sellerId,
    name: handle || undefined,
    isProvisional: true,
    channelIdentities: [
      { channel: channelId, type: channelType, externalUserId, handle },
    ],
  });
}

/**
 * Resolve or create a customer from an order's phone number (the identity key).
 * If a `conversationCustomer` (provisional, from the DM) is provided and no
 * phone-keyed profile exists yet, that provisional profile is PROMOTED in place
 * (phone attached, isProvisional cleared) rather than creating a duplicate.
 *
 * @returns {Promise<{ customer, merged: boolean, created: boolean }>}
 */
export async function resolveByPhone({
  sellerId,
  phone,
  name,
  conversationCustomer = null,
  channelIdentity = null,
}) {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    // No usable phone: fall back to the provisional conversation customer, else create bare.
    if (conversationCustomer) return { customer: conversationCustomer, merged: false, created: false };
    const created = await Customer.create({ seller: sellerId, name, isProvisional: true });
    return { customer: created, merged: false, created: true };
  }

  // 1) Existing phone-keyed profile wins.
  const existing = await Customer.findOne({ seller: sellerId, phones: normalized });
  if (existing) {
    let dirty = false;
    if (name && !existing.name) {
      existing.name = name;
      dirty = true;
    }
    if (channelIdentity && !hasIdentity(existing, channelIdentity.externalUserId)) {
      existing.channelIdentities.push(channelIdentity);
      dirty = true;
    }
    // If a provisional conversation customer existed and differs, fold it in.
    if (
      conversationCustomer &&
      String(conversationCustomer._id) !== String(existing._id) &&
      conversationCustomer.isProvisional
    ) {
      await foldProvisionalInto(existing, conversationCustomer);
      dirty = true;
    }
    if (dirty) await existing.save();
    return { customer: existing, merged: true, created: false };
  }

  // 2) Promote the provisional conversation customer in place.
  if (conversationCustomer && conversationCustomer.isProvisional) {
    conversationCustomer.phones = addUnique(conversationCustomer.phones, normalized);
    conversationCustomer.isProvisional = false;
    if (name && !conversationCustomer.name) conversationCustomer.name = name;
    if (channelIdentity && !hasIdentity(conversationCustomer, channelIdentity.externalUserId)) {
      conversationCustomer.channelIdentities.push(channelIdentity);
    }
    await conversationCustomer.save();
    return { customer: conversationCustomer, merged: true, created: false };
  }

  // 3) Fresh phone-keyed profile.
  const created = await Customer.create({
    seller: sellerId,
    name,
    phones: [normalized],
    isProvisional: false,
    channelIdentities: channelIdentity ? [channelIdentity] : [],
  });
  return { customer: created, merged: false, created: true };
}

function hasIdentity(customer, externalUserId) {
  if (!externalUserId) return true; // nothing to add
  return (customer.channelIdentities || []).some((ci) => ci.externalUserId === externalUserId);
}

function addUnique(arr, value) {
  const set = new Set(arr || []);
  set.add(value);
  return Array.from(set);
}

/** Merge a provisional customer's identities/notes into a surviving profile, then delete it. */
async function foldProvisionalInto(survivor, provisional) {
  for (const ci of provisional.channelIdentities || []) {
    if (!hasIdentity(survivor, ci.externalUserId)) survivor.channelIdentities.push(ci);
  }
  for (const note of provisional.notes || []) survivor.notes.push(note);
  // Re-point the provisional's conversations/orders to the survivor.
  const { Conversation } = await import('../models/Conversation.js');
  const { Order } = await import('../models/Order.js');
  await Conversation.updateMany({ customer: provisional._id }, { $set: { customer: survivor._id } });
  await Order.updateMany({ customer: provisional._id }, { $set: { customer: survivor._id } });
  await Customer.deleteOne({ _id: provisional._id });
}
