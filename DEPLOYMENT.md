# Deployment Guide — DokaanDM

This covers a production deploy: **MongoDB Atlas** (database), **Render/Railway/Fly** (API), **Vercel** (client), and wiring the **Meta app** + webhook. Adapt hosts as you like — nothing here is host-specific beyond the examples.

---

## 0. Architecture recap

```
Browser ── HTTPS ──> Vercel (React static)  ──/api/*──>  API (Render/Railway/Fly)  ──>  MongoDB Atlas
                                                   ▲
                                     Meta webhooks │ (POST /api/webhooks/meta, signature-verified)
```

The client calls the API at a single base URL. Meta posts webhooks directly to the API's public HTTPS endpoint.

---

## 1. Database — MongoDB Atlas

1. Create a free/shared cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Add a database user + password.
3. Network access: allow your API host's egress IPs (or `0.0.0.0/0` for a first pass, then tighten).
4. Copy the connection string → this is `MONGO_URI` (append `/dokaandm`).

Indexes are declared in the Mongoose models and created automatically on first connect. For large datasets, run once with `autoIndex` on (default) then consider disabling it in a very high-write production and managing indexes manually.

---

## 2. API server — Render (example)

1. New **Web Service** → connect the repo → root directory `server`.
2. Build command: `npm install` · Start command: `npm start`.
   - Monorepo note: if the host installs only the sub-directory, either deploy from the repo root with `npm install && npm start -w server`, or vendor the `shared` package. The simplest reliable setup is **build from repo root**: Build `npm install`, Start `npm start -w server`.
3. Set environment variables (from `server/.env.example`):

   | Variable | Production value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | provided by host (Render sets `PORT`) |
   | `MONGO_URI` | your Atlas URI |
   | `CORS_ORIGINS` | your client URL, e.g. `https://app.dokaandm.com` (comma-separate if several) — **no wildcards** |
   | `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | `openssl rand -hex 32` each |
   | `TOKEN_ENCRYPTION_KEY` | `openssl rand -hex 32` (exactly 64 hex chars) |
   | `COOKIE_SECURE` | `true` |
   | `COOKIE_SAMESITE` | `none` if client & API are on different domains, else `lax` |
   | `COOKIE_DOMAIN` | your apex domain if sharing cookies across subdomains, else blank |
   | `CLIENT_URL` | your client URL (used for OAuth success redirect) |
   | `META_*` | see §4 |

4. `trust proxy` is already enabled so `req.ip`, rate limiting, and Secure cookies work behind the platform proxy.
5. Verify: `GET https://<api-host>/api/health` returns `{"status":"ok"}`.

> **Cross-site cookies:** if the API and client are on different registrable domains, the refresh cookie needs `COOKIE_SAMESITE=none` + `COOKIE_SECURE=true`, and CORS `credentials` is already enabled. Putting both behind the same apex domain (e.g. `app.` + `api.`) is simpler and more robust.

**Railway / Fly.io** are equivalent: set the same env vars, start with `npm start -w server`, expose the web port.

---

## 3. Client — Vercel

1. New Project → import the repo → root directory `client`.
2. Framework preset: **Vite**. Build: `npm install && npm run build` (from repo root context so the `shared` workspace resolves — set the Vercel *Root Directory* to the repo root and Build Command to `npm install && npm run build -w client`, Output Directory `client/dist`).
3. The client calls `/api/*`. In production, point it at the API by either:
   - **Rewrite (recommended):** add a `vercel.json` rewrite so `/api/*` → `https://<api-host>/api/*` (keeps cookies same-origin), **or**
   - build the client against an absolute API base URL (add an env-driven base in `client/src/lib/api.js`).

Example `client/vercel.json` rewrite:
```json
{
  "rewrites": [{ "source": "/api/:path*", "destination": "https://<api-host>/api/:path*" }]
}
```
This keeps the browser talking to one origin, so the httpOnly refresh cookie flows without SameSite headaches.

---

## 4. Meta app + webhook

This is the **critical-path** dependency (App Review takes 4–6 weeks). Start it early — you can pilot with up to 25 test users meanwhile.

1. Create a **Business-type** app at [developers.facebook.com](https://developers.facebook.com).
2. Add products: **Facebook Login for Business**, **Instagram Graph API**, **Messenger**.
3. Complete **Business Verification** (required for Advanced Access).
4. OAuth redirect URI (Facebook Login settings) — must exactly match:
   `https://<api-host>/api/channels/oauth/callback`
   Set the same value as `META_OAUTH_REDIRECT_URI`.
5. Env vars on the API:
   - `META_APP_ID`, `META_APP_SECRET`
   - `META_GRAPH_VERSION` (e.g. `v21.0`)
   - `META_OAUTH_SCOPES` (defaults provided in `.env.example`)
   - `META_WEBHOOK_VERIFY_TOKEN` — any secret string you choose
   - `META_TEST_MODE=true` while piloting (≤25 accounts), `false` after approval
6. **Webhook** (Messenger + Instagram products):
   - Callback URL: `https://<api-host>/api/webhooks/meta`
   - Verify token: same as `META_WEBHOOK_VERIFY_TOKEN`
   - Subscribe fields: `messages`, `messaging_postbacks`, `feed`, `comments`
   - Meta calls `GET /api/webhooks/meta` to verify (echoes `hub.challenge`), then `POST`s events. Every POST is verified against `X-Hub-Signature-256` and rejected if invalid.
7. **App Review:** submit `instagram_business_manage_messages` (and related messaging perms) with a screencast of the working inbox. Until approved, the 25-account test allowance covers the pilot.

---

## 5. Post-deploy checklist

- [ ] `GET /api/health` → `200 { status: "ok", db: "connected" }`
- [ ] `GET /api/docs` loads Swagger UI
- [ ] Register + login work; refresh-cookie is `HttpOnly; Secure`
- [ ] CORS allows only your client origin(s)
- [ ] `TOKEN_ENCRYPTION_KEY` is 64 hex chars and **backed up** (losing it makes stored Meta tokens undecryptable)
- [ ] Secrets are set via the host's env store — never committed
- [ ] Meta webhook verification handshake succeeded
- [ ] (Optional) seed **not** run against production, or run a one-off admin to set a real seller's plan

---

## 6. Operational notes

- **Logs:** structured JSON via pino, with per-request IDs (`x-request-id`). Pipe host logs into your log aggregator.
- **Scaling the outbound message queue:** the 200-msg/hour/account rate-limit queue is in-memory (fine for a single instance / the MVP). For multiple API instances, move it to a durable queue (BullMQ + Redis) — the `messageQueue` service is the single seam to swap.
- **SSE (`/api/events`):** live updates use Server-Sent Events. Ensure your proxy does not buffer (`X-Accel-Buffering: no` is already set) and allows long-lived connections.
- **Backups:** enable Atlas automated backups. Keep `TOKEN_ENCRYPTION_KEY` in a secrets manager separate from DB backups.
- **Monthly order counters** reset lazily on the first order after a month boundary (see `planService.rollOrderPeriodIfNeeded`).
