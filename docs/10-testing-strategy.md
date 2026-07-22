# 10 · Testing Strategy

## 1. Philosophy

Test the things that are **hard to get right and expensive to get wrong** — the core differentiators and the safety‑critical invariants — with fast, deterministic tests. Don't chase coverage for its own sake.

The two differentiators (**COD risk scoring** and **customer identity resolution**) are pure/near‑pure and are tested exhaustively. Multi‑tenant isolation is treated as a **security invariant** and has dedicated tests.

## 2. Test stack

- **Runner:** [Vitest](https://vitest.dev) (native ESM, fast).
- **HTTP:** Supertest against the real Express app (`createApp()`), no network.
- **Database:** `mongodb-memory-server` — a real in‑memory MongoDB, so indexes, unique constraints, and aggregations behave like production. No external DB needed.
- **Isolation:** `beforeEach` clears all collections; `fileParallelism: false` avoids cross‑file DB contention.
- **Env:** `tests/setup.js` sets deterministic secrets and silences logs before any app module loads.

Run: `npm test` (from repo root or `-w server`). Watch: `npm run test:watch -w server`.

## 3. What's covered (current suite — 52 tests, 8 files)

| File | Focus | Highlights |
|------|-------|-----------|
| `risk.test.js` | **COD risk scoring** (unit) | Every label branch + boundaries: new/reliable/medium/risky, the 0.15 & 0.35 thresholds, the "≥2 returns in ≤3 orders" absolute rule, divide‑by‑zero, negative/non‑numeric coercion, rounding. |
| `phone.test.js` | **Phone normalization** (unit) | +977 prepend, existing prefixes, `00` → `+`, punctuation stripping, too‑short → null, equality across formats. |
| `identity.test.js` | **Customer identity resolution** (integration) | Provisional create + dedupe, promote‑in‑place, phone match across channels, folding a provisional into an existing profile, **cross‑tenant safety**. |
| `auth.test.js` | Auth flow (integration) | Register (Free plan, no hash leak, httpOnly cookie), duplicate email, weak password, login success/failure, protected route, refresh rotation, **refresh‑reuse detection**. |
| `orders.test.js` | Orders (integration) | Creation + totals + customer resolution, monthly quota, **status‑transition validation**, risk rollup, **order‑number generation robustness** (out‑of‑order dates). |
| `products.test.js` | **[Products]** (integration) | CRUD, auto‑SKU + custom SKU dup (409), **search by name and by SKU**, soft‑delete/archive, signed‑delta stock (floored), **product quota**, **order↔product stock decrement + units‑sold rollup**, tenant isolation. |
| `tenant.test.js` | **Multi‑tenant isolation** (security) | Seller B cannot read/modify/enumerate seller A's orders or customers (foreign id ⇒ 404). |
| `search.test.js` | Injection/regex safety (regression) | Name/SKU/order‑number search works under the `sanitizeFilter`‑off decision; regex metacharacters are escaped. |

## 4. The testing pyramid here

```
        ┌───────────────────────────┐
        │  (manual) live smoke via   │   curl / browser walkthrough
        │  running server + seed     │
        ├───────────────────────────┤
        │  integration (Supertest +  │   auth, orders, products,
        │  in‑memory Mongo)          │   identity, tenant, search
        ├───────────────────────────┤
        │  unit (pure functions)     │   risk scoring, phone norm
        └───────────────────────────┘
```

## 5. Writing a new test

- Put shared setup in `tests/helpers/` (`db.js` for the in‑memory Mongo, `app.js` for `registerAndLogin`/`auth`).
- **Always** exercise the tenancy boundary for any new resource (a "seller B can't see seller A's X" case).
- For anything money‑ or state‑machine‑related, assert the exact numbers/transitions, not just "200 OK".
- Keep unit tests for domain rules in `shared`‑backed pure functions where possible.

## 6. Manual verification checklist (pre‑release smoke)

Run `npm run seed`, start the server, log in as `demo@dokaandm.app` / `password123`, then:

- [ ] `GET /api/health` → `ok`; `GET /api/docs` loads.
- [ ] Inbox lists seeded conversations; open one; send a reply (queues → sent in dev).
- [ ] Create a product; search it by name and by SKU; toggle low‑stock filter.
- [ ] Capture an order from a conversation using the product picker; verify stock decremented and units‑sold rose.
- [ ] Move an order Pending → Confirmed (COD risk panel appears) → Shipped → Delivered.
- [ ] Open a customer; add a note, a tag, a reminder; confirm risk badge + history.
- [ ] Dashboard cards + revenue chart render.
- [ ] Register a **Free** seller → dashboard/products‑export are gated (403), quota caps enforced.

## 7. CI recommendation (not yet wired)

A minimal pipeline: `npm ci` → `npm run lint` → `npm test` → `npm run build -w client`. All four already pass locally and are the gate before deploy.

## 8. Gaps / future test work

- Frontend component/e2e tests (Playwright) — none yet; the client is verified by build + manual smoke.
- Webhook‑processing integration tests with simulated Meta payloads.
- Message‑queue back‑off behavior under a mocked rate‑limit.
- Load testing the inbox list + dashboard aggregations at scale.
