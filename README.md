# DokaanDM

**Omnichannel inbox · Order capture · Lightweight CRM for Nepali social commerce sellers.**

DokaanDM meets sellers where they already sell — Facebook & Instagram DMs — and does the two things a storefront-first tool under-serves: **fast, reliable order capture** and **remembering the customer relationship over time** (including flagging risky cash-on-delivery orders).

> `DokaanDM` is a working name, centralized in [`shared/src/brand.js`](shared/src/brand.js) — change it in one place to rebrand everywhere.

---

## What's inside

| Capability | Status |
|---|---|
| Unified Facebook + Instagram inbox (Meta Graph API + webhooks, OAuth 2.0) | ✅ |
| Order capture from a conversation, `pending → confirmed → shipped → delivered → returned` pipeline | ✅ |
| Customer profiles / lightweight CRM (phone-number identity resolution, notes, tags, reminders) | ✅ |
| COD risk flagging (rule-based, off the seller's own history — no ML) | ✅ |
| Order & business dashboard (today's orders, COD pending, follow-ups, revenue) | ✅ |
| Pricing-tier limit enforcement (Free / Starter / Growth / Business) | ✅ |
| Multi-tenant isolation from day one (every query scoped to the seller) | ✅ |

**Intentionally out of scope** (per the MVP plan): WhatsApp, TikTok, AI auto-reply, payment-gateway integration (eSewa/Khalti), storefront/website.

Full functional spec, data model, API surface, and flows: **[`PRODUCT_SPEC.md`](PRODUCT_SPEC.md)**.

---

## Tech stack

- **Frontend:** React (Vite), React Router, TanStack Query, Zustand, Tailwind CSS (custom ocean-blue design system), react-hook-form + Zod, Recharts.
- **Backend:** Node.js + Express, MongoDB + Mongoose, JWT (access + rotating refresh), Swagger/OpenAPI at `/api/docs`.
- **Shared:** a `/shared` workspace holds Zod schemas, plan limits, enums, and the **pure** COD-risk & phone-normalization logic used by both server and tests.
- **Security:** bcrypt (cost 12), httpOnly refresh cookie with rotation + reuse detection, Helmet, explicit CORS allowlist, rate limiting, AES-256-GCM encryption of Meta tokens at rest, `X-Hub-Signature-256` webhook verification, Mongoose injection protection, per-tenant data isolation (tested).

```
DookanDM/
├── shared/   # Zod schemas, plan limits, brand config, pure risk/phone logic
├── server/   # Express API + Mongoose + Swagger + tests + seed
└── client/   # React (Vite) SPA
```

---

## Quick start (local)

**Prerequisites:** Node ≥ 18.18, and a running MongoDB (local `mongod` or a MongoDB Atlas URI).

```bash
# 1. Install all workspaces
npm install

# 2. Configure the server
cp server/.env.example server/.env
# Generate real secrets (macOS/Linux):
#   JWT_ACCESS_SECRET / JWT_REFRESH_SECRET  ->  openssl rand -hex 32
#   TOKEN_ENCRYPTION_KEY (must be 64 hex chars) ->  openssl rand -hex 32
# Set MONGO_URI to your database.

# 3. Seed demo data (fake sellers, channels, conversations, orders, customers)
npm run seed

# 4. Run both apps (server on :4000, client on :5173)
npm run dev
```

Open **http://localhost:5173** and log in with the seeded account:

```
email:    demo@dokaandm.app
password: password123
```

- API docs (Swagger UI): **http://localhost:4000/api/docs**
- Health check: **http://localhost:4000/api/health**

> **No Meta app yet?** That's fine. Leave `META_APP_ID`/`META_APP_SECRET` blank and the app runs in local/dev mode against seeded data — every screen works. Connect real channels once you have Meta credentials (see below).

---

## Running without live Meta (test mode)

The Meta integration is built for real (OAuth 2.0 + Graph API + signed webhooks) but is fully env-gated:

- `META_APP_ID` / `META_APP_SECRET` blank → the app runs offline on seeded data; outbound "sends" resolve locally so the UX flow is intact.
- `META_TEST_MODE=true` → matches Meta's **25-account test allowance** semantics for the pilot while App Review is pending.
- The webhook handler verifies `X-Hub-Signature-256`, dedupes events, and is structured for production traffic the moment App Review clears — no code changes needed, just credentials.

See **`server/.env.example`** for every variable, documented inline.

---

## Scripts

Run from the repo root:

| Command | What it does |
|---|---|
| `npm run dev` | Run server + client together (hot reload) |
| `npm run dev:server` / `npm run dev:client` | Run one side |
| `npm run seed` | Seed/refresh local demo data (idempotent) |
| `npm test` | Backend test suite (Vitest) |
| `npm run lint` | Lint server + client |
| `npm run build` | Production build of the client |
| `npm run format` | Prettier across the repo |

---

## Tests

```bash
npm test
```

Covers the two core differentiators explicitly, plus the critical flows:

- **COD risk scoring** — every rule branch + boundary conditions (pure function).
- **Customer identity resolution** — phone-keyed matching, provisional→promoted merge, cross-tenant safety.
- **Phone normalization** — Nepal-first formats.
- **Auth** — register/login, refresh rotation, refresh-token reuse detection.
- **Orders** — creation, totals, monthly quota, status-transition validation, risk rollup.
- **Multi-tenant isolation** — proving seller B can never read/modify seller A's data.
- **Search** — regression guard for the `sanitizeFilter` + `$regex` interaction.

Tests run against an in-memory MongoDB (`mongodb-memory-server`) — no external DB needed.

---

## Deployment

See **[`DEPLOYMENT.md`](DEPLOYMENT.md)** for deploying the client (Vercel), server (Render/Railway/Fly), database (MongoDB Atlas), and wiring up the Meta app + webhook.

---

## Design system

The ocean-blue palette (deep navy → ocean → teal → cyan → sea-foam) with full tonal ramps, spacing/typography scales, and an elevation system lives in [`client/tailwind.config.js`](client/tailwind.config.js) and [`client/src/index.css`](client/src/index.css). Components compose that language rather than using default component-library styling.
