# 14 · Architecture Decision Records (ADRs)

Short records of significant technical decisions: the context, the decision, and the consequences. Newest concerns first; status is `Accepted` unless noted.

---

## ADR‑001 · Monorepo with a shared domain package
**Status:** Accepted
**Context:** Client, server, and tests all need the same domain rules (COD risk, phone normalization, plan limits, enums, validation). Duplicating them guarantees drift.
**Decision:** npm‑workspaces monorepo with a `shared` package holding **pure** logic + Zod schemas, imported by `server` and `client`.
**Consequences:** One source of truth; the risk/phone functions are unit‑tested once and trusted everywhere. Slight build coupling (client bundles `shared`). Worth it.

## ADR‑002 · Express over Fastify
**Status:** Accepted
**Context:** Need a Node HTTP framework a solo founder can move fast in.
**Decision:** **Express**. Mature middleware ecosystem (helmet, express‑rate‑limit, swagger‑ui‑express), abundant examples, no MVP performance requirement Express can't meet.
**Consequences:** Familiar, well‑documented. If raw throughput ever matters, revisit — but not before real load data.

## ADR‑003 · MongoDB + Mongoose
**Status:** Accepted
**Context:** Conversation/message data is document‑shaped and evolves; identity resolution needs flexible arrays (phones, channel identities); the founder wants a managed DB.
**Decision:** MongoDB (Atlas) with Mongoose for schemas/indexes/validation.
**Consequences:** Natural fit for threads/messages and denormalized rollups (`riskCache`, `stats`). Requires disciplined indexing and explicit tenant scoping (no FK constraints). Multikey indexes power phone identity resolution.

## ADR‑004 · JWT access + rotating httpOnly refresh, with reuse detection
**Status:** Accepted
**Context:** Need secure, stateless‑ish auth that resists token theft, without a heavy session store.
**Decision:** Short access token (memory only) + long refresh token as an httpOnly cookie; store only the refresh **hash**; rotate on every use; revoke the whole **family** on reuse.
**Consequences:** Strong theft resistance; refresh tokens are revocable and TTL‑expired. Slightly more logic than plain JWT. See [08 · Security](./08-security.md).

## ADR‑005 · Real‑time via Server‑Sent Events (SSE), not WebSockets
**Status:** Accepted
**Context:** The UI needs push for new messages/order changes; traffic is server→client only.
**Decision:** SSE (`/api/events`), broker keyed by tenant. Token passed as a query param (EventSource can't set headers) and verified server‑side.
**Consequences:** Simpler than WebSockets, auto‑reconnects, works over plain HTTP. In‑memory broker assumes a single instance (see ADR‑006).

## ADR‑006 · In‑process message queue & SSE broker for the MVP
**Status:** Accepted (with a known scaling seam)
**Context:** Outbound sends must respect Meta's 200/hr/account cap; clients need push. A durable queue + pub/sub (Redis) is more than a single‑instance MVP needs.
**Decision:** Hand‑rolled **in‑memory** queue (`messageQueue.js`) and SSE broker (`realtime.js`), single instance.
**Consequences:** Zero extra infra now. **Explicit seam:** moving to multiple instances requires BullMQ/Redis for the queue and Redis pub/sub for SSE (documented in [11 §10](./11-deployment-operations.md)).

## ADR‑007 · Disable Mongoose global `sanitizeFilter`; validate at the source instead
**Status:** Accepted (supersedes the initial choice to enable it)
**Context:** `sanitizeFilter: true` was enabled to block NoSQL operator injection, but it non‑deterministically wrapped **legitimate** operator queries (`$in`, `$lt`, `$regex`) into `$eq` depending on model load order — silently breaking search and seed/admin queries.
**Decision:** Turn it **off**. Prevent injection at the source: Zod reduces all input to primitives; direct query‑param filters are `String()`‑coerced; user regex goes through `escapeRegex` + `mongoose.trusted`.
**Consequences:** Deterministic, still injection‑safe (queries are always tenant‑scoped and inputs are primitives). Regression‑guarded by `search.test.js`.

## ADR‑008 · Money as integer paisa
**Status:** Accepted
**Context:** NPR amounts summed as floats accumulate rounding errors.
**Decision:** Store/compute money as integer **paisa** (NPR×100); convert at the API edge.
**Consequences:** Exact arithmetic; field naming convention (`*Paisa`). Minor conversion boilerplate at boundaries.

## ADR‑009 · Sequential IDs derived from the max number, not `createdAt`
**Status:** Accepted (fixed a latent bug)
**Context:** Order numbers / SKUs were generated from the most‑recent‑by‑`createdAt` record, which duplicated a number when timestamps weren't monotonic with the number (seeded/backfilled data) → unique‑index collisions.
**Decision:** Derive the next value from the **highest existing number** (lexicographic sort on the zero‑padded string == numeric).
**Consequences:** Robust to out‑of‑order timestamps. Regression test added.

## ADR‑010 · Product link on order items is a snapshot, not a live reference
**Status:** Accepted
**Context:** [Products] Orders may reference catalog products, but historical orders must not change when a product is later edited/renamed/repriced/archived.
**Decision:** Store `productId` **plus** a snapshot of `productName`, `unitPricePaisa`, and `sku` on the order item.
**Consequences:** Immutable order history; products can be freely edited/archived. Slight denormalization (intended).

## ADR‑011 · Zustand + TanStack Query on the client (not Redux Toolkit)
**Status:** Accepted
**Context:** Need server‑cache management + a little UI state, on a solo build.
**Decision:** TanStack Query owns server state; Zustand holds the small amount of client/UI state (session, toasts).
**Consequences:** Far less boilerplate than Redux; clear split (server vs client state). Team must not duplicate server data into Zustand.

## ADR‑012 · Semantic design tokens with light/dark theming
**Status:** Accepted (evolved from the initial single‑palette design)
**Context:** The app should feel like a real SaaS product and support light/dark without rewriting components.
**Decision:** CSS‑variable **semantic tokens** (`--bg`, `--surface`, `--brand`, `--fg`, …) surfaced as Tailwind colors (`bg-surface`, `text-fg`, `text-brand`), with a selectable brand accent.
**Consequences:** Theme changes are variable swaps, not component edits. New code must use tokens, not hardcoded colors (see [13 · Coding Standards](./13-coding-standards.md)).

## ADR‑013 · Product catalog is internal, not a storefront
**Status:** Accepted
**Context:** [Products] Sellers wanted reusable products, but a public storefront is explicitly out of scope and against the core positioning.
**Decision:** Build an **internal** catalog + inventory aid for order capture (search, stock, sales rollups) — no public pages, cart, or checkout.
**Consequences:** Speeds up order capture and gives basic stock/sales visibility without contradicting the "no storefront" positioning.
