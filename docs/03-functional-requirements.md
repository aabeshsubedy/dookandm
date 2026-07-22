# 03 · Functional Requirements

Testable, feature‑level requirements. IDs are stable references (e.g. `FR-O3`). Priorities: **MUST** (v1 core), **SHOULD** (important), **COULD** (nice‑to‑have present).

Legend: 🔒 requires authentication · 💳 paid feature (gated per plan).

---

## FR‑A · Authentication & Account

| ID | Priority | Requirement |
|----|----------|-------------|
| FR‑A1 | MUST | A visitor can register with full name, business name, email (unique), optional phone, and password. |
| FR‑A2 | MUST | Passwords are hashed with bcrypt (cost ≥ 12); hashes are never returned or logged. |
| FR‑A3 | MUST | Login issues a short‑lived JWT access token (~15 min) and sets an httpOnly, Secure, SameSite refresh cookie (~7 days). |
| FR‑A4 | MUST | The refresh token rotates on every use; reuse of a consumed token revokes the whole token family (theft detection). |
| FR‑A5 | MUST | Logout revokes the current refresh token. |
| FR‑A6 | MUST | New sellers start on the **Free** plan, `planStatus: active`. |
| FR‑A7 | MUST | 🔒 `GET /auth/me` returns the current seller, plan, limits, and live usage. |
| FR‑A8 | SHOULD | 🔒 A user can re‑confirm their password (`/auth/verify-password`) before sensitive actions. |
| FR‑A9 | MUST | Auth endpoints are rate‑limited. |

## FR‑I · Unified Inbox (Facebook + Instagram)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR‑I1 | MUST | A seller connects a Facebook Page and/or Instagram business account via Meta OAuth 2.0. |
| FR‑I2 | MUST | Incoming messages/comments arrive via Meta **webhooks** (near real‑time), not polling. |
| FR‑I3 | MUST | FB and IG threads are normalized to one schema and render identically. |
| FR‑I4 | MUST | The thread list shows contact name/handle, channel badge (FB/IG), last‑message snippet, timestamp, unread indicator, and an order indicator. |
| FR‑I5 | MUST | Selecting a thread shows full chronological history with inbound/outbound distinction and send status. |
| FR‑I6 | MUST | 🔒 A seller replies from inside the app; the reply is sent through the native Meta channel. |
| FR‑I7 | SHOULD | Replies update optimistically and reconcile on send confirmation; failures show a retry affordance. |
| FR‑I8 | MUST | Threads have per‑seller read/unread state; opening marks read; an unread filter exists. |
| FR‑I9 | MUST | Full‑text‑ish search across contact handle (and message body server‑side). |
| FR‑I10 | MUST | Filters: channel (FB/IG), unread, has‑order. |
| FR‑I11 | MUST | Outbound sends respect the 200‑msg/hour/account cap via a queue with back‑off (queue, don't drop). |
| FR‑I12 | SHOULD | The inbox is keyboard‑navigable (`j/k` move, `Enter` open, `/` search, `r` reply, `⌘/Ctrl+Enter` send). |
| FR‑I13 | MUST | Webhook payloads are signature‑verified (`X‑Hub‑Signature‑256`); unverified payloads are rejected. |
| FR‑I14 | MUST | Webhook processing is idempotent (deduped by Meta message id). |

## FR‑O · Order Capture & Pipeline

| ID | Priority | Requirement |
|----|----------|-------------|
| FR‑O1 | MUST | 🔒 From a conversation, "Create Order" opens a form pre‑filled where possible (name/handle, channel, linked conversation). |
| FR‑O2 | MUST | Order fields: line items (name, qty, unit price), phone (required), address, payment type, payment reference, shipping, notes; totals auto‑compute. |
| FR‑O2b | SHOULD | **[Products]** A line item may link a catalog product via a searchable picker (by name or SKU) that autofills name + price; name/price are snapshotted. |
| FR‑O3 | MUST | Status pipeline `pending → confirmed → shipped → delivered → returned` (+ `cancelled`) with validated transitions; each change is audit‑logged. |
| FR‑O4 | MUST | Orders link to a `Customer` (by phone) and to the source `Conversation`; history rolls up per customer. |
| FR‑O5 | MUST | No payment processing; payment type/reference are logged fields only. |
| FR‑O6 | MUST | Pipeline UI: kanban board 💳 **and** list with status filter (Free = basic list). |
| FR‑O7 | MUST | Per‑seller sequential, human‑readable order numbers (`DKN‑000123`). |
| FR‑O8 | MUST | 💳 Order creation counts against the monthly order quota; over‑limit is blocked with an upgrade prompt. |
| FR‑O9 | SHOULD | 💳 Orders are exportable to CSV. |

## FR‑P · Product Catalog **[Products]**

| ID | Priority | Requirement |
|----|----------|-------------|
| FR‑P1 | SHOULD | 🔒 A seller can create products: name, SKU (unique per seller; auto if blank), price, optional cost, category, description, image URL. |
| FR‑P2 | SHOULD | Products are searchable by **name and product ID (SKU)** in one query, plus category / status / low‑stock filters. |
| FR‑P3 | SHOULD | Inventory tracking is opt‑in per product; tracked products show in/low/out‑of‑stock; untracked = unlimited. |
| FR‑P4 | SHOULD | Stock can be adjusted by a signed delta (floored at 0). |
| FR‑P5 | SHOULD | Linking a product to an order snapshots name+SKU, decrements tracked stock, and rolls up units sold/revenue. |
| FR‑P6 | SHOULD | Deleting a product **archives** it (soft delete); order history stays intact. |
| FR‑P7 | SHOULD | 💳 Product creation counts against a per‑plan product limit. |
| FR‑P8 | COULD | 💳 The catalog is exportable to CSV. |

## FR‑C · Customer Profiles / CRM

| ID | Priority | Requirement |
|----|----------|-------------|
| FR‑C1 | MUST | Every conversation and order resolves to a customer profile by phone across channels (see [02 §3](./02-business-logic.md#3-customer-identity-resolution)). |
| FR‑C2 | MUST | Provisional (channel‑keyed) customers are created for inbound DMs and reconciled when a phone appears — no duplicates. |
| FR‑C3 | MUST | 🔒 A profile shows name, phones, linked channels, full order history, lifetime value, order/return counts, and COD risk. |
| FR‑C4 | MUST | 💳 Tags (with presets VIP/risky/regular/wholesale). |
| FR‑C5 | MUST | 💳 Free‑text, timestamped notes (edits audit‑logged). |
| FR‑C6 | MUST | 💳 Date‑based follow‑up reminders; due/overdue surface on the dashboard. |
| FR‑C7 | MUST | 💳 Customer profiles count against the plan cap (manual create). |

## FR‑R · COD Risk Flagging

| ID | Priority | Requirement |
|----|----------|-------------|
| FR‑R1 | MUST | 💳 A rule‑based risk label (new/reliable/medium/risky) is computed per customer from the seller's own order history. |
| FR‑R2 | MUST | The badge shows on the profile and inline at COD confirmation, always with the underlying numbers. |
| FR‑R3 | MUST | Scoring is deterministic and unit‑tested; thresholds are config constants (no ML). |
| FR‑R4 | MUST | Risk is always consistent with current order data (recomputed on status change). |

## FR‑D · Dashboard

| ID | Priority | Requirement |
|----|----------|-------------|
| FR‑D1 | MUST | 💳 Summary cards: today's orders (count + value), pending COD confirmations, follow‑ups due, revenue this month. |
| FR‑D2 | MUST | 💳 30‑day daily revenue chart (delivered‑order value). |
| FR‑D3 | MUST | 💳 Pipeline stage counts and overdue follow‑ups list. |
| FR‑D4 | MUST | All figures are seller‑scoped aggregations over existing data (no new model). |

## FR‑S · Plans & Settings

| ID | Priority | Requirement |
|----|----------|-------------|
| FR‑S1 | MUST | 🔒 `GET /plan` returns plan, limits, and live usage meters. |
| FR‑S2 | MUST | A public pricing catalog is available. |
| FR‑S3 | MUST | Locked features render an upgrade state (not a broken screen); quotas show meters and a CTA at the cap. |
| FR‑S4 | SHOULD | Light/dark theme with a selectable brand accent. |
| FR‑S5 | MUST | 🔒 Channel management: connect, sync, disconnect. |
| FR‑S6 | SHOULD | 🔒 An audit/activity log is viewable. |

## FR‑SYS · System

| ID | Priority | Requirement |
|----|----------|-------------|
| FR‑SYS1 | MUST | `GET /api/health` reports liveness + DB connectivity. |
| FR‑SYS2 | MUST | `GET /api/docs` serves live Swagger UI kept in sync with routes. |
| FR‑SYS3 | MUST | 🔒 `GET /api/events` streams real‑time updates (SSE), tenant‑scoped. |
| FR‑SYS4 | MUST | All list endpoints are paginated. |
