import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../lib/ApiError.js';

/**
 * Thin wrapper over the Meta Graph API. All network calls live here so the rest
 * of the app is transport-agnostic and easy to test/mock.
 *
 * When META is not configured (no app id/secret), calls that require the network
 * throw a clear "not configured" error — the app still runs for local dev/seed.
 */
const GRAPH = () => `https://graph.facebook.com/${env.META_GRAPH_VERSION}`;

function ensureConfigured() {
  if (!env.metaConfigured) {
    throw ApiError.badRequest(
      'Meta integration is not configured. Set META_APP_ID and META_APP_SECRET.',
      { code: 'META_NOT_CONFIGURED' }
    );
  }
}

/** Build the OAuth authorize URL. `state` should be a signed value binding the seller. */
export function buildOAuthUrl(state) {
  ensureConfigured();
  const params = new URLSearchParams({
    client_id: env.META_APP_ID,
    redirect_uri: env.META_OAUTH_REDIRECT_URI,
    state,
    scope: env.metaScopes.join(','),
    response_type: 'code',
  });
  return `https://www.facebook.com/${env.META_GRAPH_VERSION}/dialog/oauth?${params}`;
}

async function graphGet(path, params = {}) {
  const url = new URL(`${GRAPH()}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { method: 'GET' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    logger.warn({ status: res.status, error: json?.error }, 'Meta Graph GET failed');
    throw new ApiError(res.status, 'META_API_ERROR', json?.error?.message || 'Meta API error');
  }
  return json;
}

async function graphPost(path, body, accessToken) {
  const url = new URL(`${GRAPH()}${path}`);
  if (accessToken) url.searchParams.set('access_token', accessToken);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const meta = json?.error || {};
    // Surface rate-limit codes so the queue can back off.
    const rateLimited = [4, 17, 32, 613].includes(meta.code);
    const err = new ApiError(res.status, 'META_API_ERROR', meta.message || 'Meta API error');
    err.rateLimited = rateLimited || res.status === 429;
    err.metaCode = meta.code;
    throw err;
  }
  return json;
}

/** Exchange an OAuth code for a short-lived user token, then a long-lived one. */
export async function exchangeCodeForToken(code) {
  ensureConfigured();
  const short = await graphGet('/oauth/access_token', {
    client_id: env.META_APP_ID,
    client_secret: env.META_APP_SECRET,
    redirect_uri: env.META_OAUTH_REDIRECT_URI,
    code,
  });
  const long = await graphGet('/oauth/access_token', {
    grant_type: 'fb_exchange_token',
    client_id: env.META_APP_ID,
    client_secret: env.META_APP_SECRET,
    fb_exchange_token: short.access_token,
  });
  return long; // { access_token, expires_in? }
}

/** List the Facebook Pages (with page tokens) the user manages, plus linked IG accounts. */
export async function listManagedPages(userAccessToken) {
  ensureConfigured();
  const json = await graphGet('/me/accounts', {
    access_token: userAccessToken,
    fields: 'id,name,access_token,instagram_business_account{id,username}',
  });
  return json.data || [];
}

/** Subscribe a page to webhook fields for messaging + comments. */
export async function subscribePageWebhooks(pageId, pageAccessToken) {
  ensureConfigured();
  return graphPost(
    `/${pageId}/subscribed_apps`,
    { subscribed_fields: ['messages', 'messaging_postbacks', 'feed', 'comments'] },
    pageAccessToken
  );
}

/** Send a text message via the page (works for Messenger + IG messaging). */
export async function sendMessage({ pageId, recipientId, text, accessToken }) {
  ensureConfigured();
  return graphPost(
    `/${pageId}/messages`,
    { recipient: { id: recipientId }, message: { text }, messaging_type: 'RESPONSE' },
    accessToken
  );
}

/** Verify the X-Hub-Signature-256 header against the raw request body. */
export function verifyWebhookSignature(rawBody, signatureHeader) {
  if (!env.META_APP_SECRET) return env.META_TEST_MODE; // allow in test mode w/o secret
  if (!signatureHeader) return false;
  const [algo, sig] = signatureHeader.split('=');
  if (algo !== 'sha256' || !sig) return false;
  const expected = crypto
    .createHmac('sha256', env.META_APP_SECRET)
    .update(rawBody)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}
