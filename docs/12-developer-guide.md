# 12 · Developer Guide

Everything you need to run, understand, and change the codebase locally.

## 1. Prerequisites

- **Node ≥ 18.18** (ESM throughout; developed on Node 20+).
- **MongoDB** running locally (`mongod`) or a MongoDB Atlas URI.
- macOS/Linux/WSL. `openssl` for generating secrets.

## 2. First‑time setup

```bash
# 1. Install all workspaces (root uses npm workspaces)
npm install

# 2. Configure the server
cp server/.env.example server/.env
#    Generate real secrets:
#      JWT_ACCESS_SECRET / JWT_REFRESH_SECRET  →  openssl rand -hex 32
#      TOKEN_ENCRYPTION_KEY (must be 64 hex)    →  openssl rand -hex 32
#    Set MONGO_URI if not using the default localhost.

# 3. Seed demo data (idempotent — safe to re‑run)
npm run seed

# 4. Run client + server together
npm run dev
```

- App: **http://localhost:5173** · API: **http://localhost:4000** · Swagger: **/api/docs**
- Demo login: **`demo@dokaandm.app`** / **`password123`** (seeded on the Starter plan so every feature is visible).

> **No Meta app?** Leave `META_APP_ID`/`META_APP_SECRET` blank — the app runs fully on seed data; outbound "sends" resolve locally so the UX flow works end‑to‑end.

## 3. Scripts (run from repo root)

| Command | Does |
|---------|------|
| `npm run dev` | Server + client with hot reload (concurrently). |
| `npm run dev:server` / `npm run dev:client` | One side only. |
| `npm run seed` | Seed/refresh local demo data. |
| `npm test` | Backend test suite (Vitest). |
| `npm run lint` | Lint server + client. |
| `npm run build` | Production build of the client. |
| `npm run format` | Prettier across the repo. |

Workspace‑scoped variants: `npm run <script> -w server` / `-w client`.

## 4. Monorepo layout

```
DookanDM/
├── shared/   @dokaandm/shared  — pure domain logic, Zod schemas, plan config, brand
│   └── src/  brand · constants · plans · phone · risk · schemas · index
├── server/   @dokaandm/server  — Express API
│   ├── src/  config · lib · middleware · models · services · routes · app.js · index.js
│   ├── tests/  Vitest suites + helpers
│   └── scripts/seed.js
└── client/   @dokaandm/client  — React (Vite) SPA
    └── src/  pages · features · components(ui/common/layout/brand) · hooks · store · lib
```

The **`shared`** package is imported by both server and client (e.g. `import { scoreCodRisk, normalizePhone, PLAN_LIMITS } from '@dokaandm/shared'`). Change a domain rule once, and everyone agrees.

## 5. How to add a feature (worked pattern)

Adding a new tenant‑owned resource ("widgets") touches these layers, in order:

1. **shared** — add any enums to `constants.js`, Zod schemas to `schemas.js`, plan limits to `plans.js` (if quota‑capped).
2. **model** — `server/src/models/Widget.js` with `seller` + the right indexes; export from `models/index.js`.
3. **service** (if there's real logic) — `server/src/services/widgetService.js`.
4. **middleware** — add a quota check to `middleware/plan.js` if capped.
5. **route** — `server/src/routes/widgets.routes.js` with `requireAuth`, `validate(schema)`, quota/feature gates, `asyncHandler`, and **inline `@openapi` annotations**. Mount it in `routes/index.js` and add the tag in `config/swagger.js`.
6. **tests** — CRUD + tenancy isolation in `server/tests/widgets.test.js`.
7. **client** — hooks in `hooks/data.js`, a page in `pages/`, feature components in `features/widgets/`, a nav entry in `AppShell`, a route in `App.jsx`.
8. **docs** — update [06 Data Model](./06-data-model.md), [07 API](./07-api-reference.md), and (if it changes rules) [02 Business Logic](./02-business-logic.md).

> Copy the **Products** feature as a reference — it exercises every layer end‑to‑end.

## 6. Local Meta testing (optional)

To exercise the real OAuth + webhook path locally you need a public HTTPS tunnel (e.g. `ngrok`) pointing at `:4000`, a Business‑type Meta app, and the `META_*` env vars set (see [11 · Operations §4](./11-deployment-operations.md)). Most day‑to‑day work does **not** need this — the seed data covers the whole UI.

## 7. Debugging tips

- **Server logs** are pretty‑printed in dev (pino‑pretty). Every request has an `x-request-id`.
- **DB inspection:** connect with `mongosh` to `dokaandm`; the demo tenant is `demo@dokaandm.app`.
- **Swagger** at `/api/docs` is the fastest way to try endpoints with a pasted Bearer token.
- **Reset state:** `npm run seed` wipes and reseeds the demo tenants (idempotent).
- **Env errors on boot:** `env.js` prints exactly which variable failed validation.

## 8. Gotchas

- Money is **paisa** in code/DB; convert at the edges only.
- Every DB query must include `seller: req.tenantId`.
- Don't build any deferred feature (WhatsApp, TikTok, AI reply, payments, storefront) — flag it instead ([01 §5](./01-product-vision.md#5-feature-set-v1--post-v1)).
- Env vars are **not** hot‑reloaded — restart the server after editing `.env`.
- The product/order **numbering** helpers sort by the number, not `createdAt` — keep it that way.
