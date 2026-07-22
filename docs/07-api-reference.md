# 07 · API Reference

Base path: **`/api`**. Live, always‑current interactive docs (Swagger UI): **`/api/docs`** · raw OpenAPI JSON: **`/api/docs.json`**. This document is the human‑readable companion; the running Swagger spec is generated from the route annotations and is authoritative.

## Conventions

- **Auth:** 🔒 endpoints require `Authorization: Bearer <accessToken>`. The refresh token is an httpOnly cookie (`dokaan_rt`) and is never sent in a header.
- **Envelopes:**
  - Success: `{ "data": … }` (plus `"pagination"` on list endpoints).
  - Error: `{ "error": { "code": "STRING_CODE", "message": "...", "details"?: … } }`.
- **Pagination:** `?page` (default 1), `?limit` (default 25, max 100). Response `pagination: { page, limit, total, totalPages, hasNext }`.
- **Tenancy:** every response is scoped to the authenticated seller's tenant. Foreign ids return **404**.
- **Money:** requests take rupees (`priceNpr`, `unitPriceNpr`); responses return paisa (`*Paisa`).

## Error codes

| Code | HTTP | Meaning |
|------|------|---------|
| `BAD_REQUEST` | 400 | Validation failed (`details` lists field errors) or illegal operation. |
| `UNAUTHORIZED` / `TOKEN_INVALID` | 401 | Missing/expired/invalid access token. |
| `INVALID_CREDENTIALS` / `INVALID_PASSWORD` | 401 | Wrong email/password. |
| `REFRESH_INVALID` | 401 | Refresh token missing/expired/reused. |
| `PLAN_FEATURE_LOCKED` | 403 | Feature not in the current plan (`requiredPlan` in details). |
| `PLAN_QUOTA_EXCEEDED` | 403 | Resource cap reached (`resource`, `limit`, `used` in details). |
| `CORS_DENIED` | 403 | Origin not allowlisted. |
| `NOT_FOUND` | 404 | Resource absent or not in tenant. |
| `EMAIL_TAKEN` / `SKU_TAKEN` / `CUSTOMER_EXISTS` / `DUPLICATE` | 409 | Uniqueness conflict. |
| `RATE_LIMITED` | 429 | Too many requests. |
| `INTERNAL_ERROR` | 500 | Unexpected (no internals leaked). |

---

## Auth — `/api/auth`

| Method | Path | Auth | Body → Result |
|--------|------|------|---------------|
| POST | `/register` | — | `{fullName, businessName, email, phone?, password}` → `{seller, accessToken}` + sets refresh cookie. `409 EMAIL_TAKEN`. |
| POST | `/login` | cookie‑setting | `{email, password}` → `{seller, accessToken}` + refresh cookie. |
| POST | `/refresh` | cookie | → `{accessToken}` + rotated cookie. Reuse ⇒ `401 REFRESH_INVALID` + family revoked. |
| POST | `/logout` | — | Revokes refresh token, clears cookie → `204`. |
| GET | `/me` | 🔒 | → `{seller, plan:{plan, limits, usage, features}}`. |
| POST | `/verify-password` | 🔒 | `{password}` → `{verified:true}` or `401 INVALID_PASSWORD`. |

## Channels / Meta — `/api/channels` & `/api/webhooks`

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/channels` | 🔒 | List connected channels + `metaConfigured` flag. |
| GET | `/channels/oauth/url` | 🔒 | → `{url}` Meta OAuth authorize URL (state binds the seller). Quota‑checked. |
| GET | `/channels/oauth/callback` | state‑verified | OAuth redirect target: exchanges code, creates channels, subscribes webhooks, redirects to the app with a `?meta=` status. |
| POST | `/channels/:id/sync` | 🔒 | Backfill recent conversations/messages (no‑op in dev without Meta). |
| DELETE | `/channels/:id` | 🔒 | Disconnect (soft): `status → disconnected`. |
| GET | `/webhooks/meta` | — | Meta verification handshake (echoes `hub.challenge` if the verify token matches, else 403). |
| POST | `/webhooks/meta` | signature | Receive events. Verifies `X‑Hub‑Signature‑256` (else 401), acks 200 immediately, processes async + idempotently. Rate‑limited. |

## Inbox — `/api/conversations`

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/conversations` | 🔒 | List (filters: `channelType, kind, unread, hasOrder, q`; paginated by `lastMessageAt`). |
| GET | `/conversations/:id` | 🔒 | Thread meta + linked customer + orders. |
| GET | `/conversations/:id/messages` | 🔒 | Paginated messages (returned oldest→newest for render). |
| POST | `/conversations/:id/messages` | 🔒 | `{text}` → queued outbound message (rate‑limit aware, optimistic). |
| PATCH | `/conversations/:id` | 🔒 | `{unread?, status?}` — mark read/unread, archive. |

## Orders — `/api/orders`

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/orders` | 🔒 | List (filters `status, paymentType, q`; paginated). |
| GET | `/orders/board` | 🔒 💳 | Pipeline board: per‑stage counts + recent orders (KANBAN). |
| GET | `/orders/export.csv` | 🔒 💳 | CSV export (CSV_EXPORT). |
| POST | `/orders` | 🔒 💳(quota) | Create from conversation/manual. Body: `{conversationId?, items:[{productId?, productName, qty, unitPriceNpr}], phone, customerName?, address?, paymentType, paymentReference?, shippingNpr?, notes?}`. Resolves customer by phone, links/snapshots products, decrements stock. `403 PLAN_QUOTA_EXCEEDED` at cap. |
| GET | `/orders/:id` | 🔒 | Order detail (populated customer). |
| PATCH | `/orders/:id/status` | 🔒 | `{status}` — validated transition; `400` on illegal jump; audit‑logged; recomputes risk. |

## Products — `/api/products` **[Products]**

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/products` | 🔒 | List/search. `q` matches **name OR SKU**; filters `category, status(active\|archived\|all), lowStock=true`; paginated. |
| GET | `/products/categories` | 🔒 | Distinct category list. |
| GET | `/products/export.csv` | 🔒 💳 | CSV export (CSV_EXPORT). |
| POST | `/products` | 🔒 💳(quota) | Create. Body: `{name, sku?, priceNpr, costNpr?, category?, description?, imageUrl?, trackInventory?, stock?}`. Auto SKU if blank; `409 SKU_TAKEN` on dup; `403 PLAN_QUOTA_EXCEEDED` at cap. |
| GET | `/products/:id` | 🔒 | Detail. |
| PATCH | `/products/:id` | 🔒 | Update fields (incl. `status`). `409` on SKU clash. |
| POST | `/products/:id/stock` | 🔒 | `{delta}` — adjust stock (floored at 0); `400` if not tracked. |
| DELETE | `/products/:id` | 🔒 | Archive (soft delete). |

## Customers / CRM — `/api/customers`

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/customers` | 🔒 | List/search (`q` = name or phone, `tag`; paginated). |
| POST | `/customers` | 🔒 💳(quota) | Manual create `{name?, phone, tags?, note?}`. `409 CUSTOMER_EXISTS`. |
| GET | `/customers/:id` | 🔒 | Profile + order history + reminders. |
| PATCH | `/customers/:id` | 🔒 | `{name?, phones?, tags?}`. |
| POST | `/customers/:id/notes` | 🔒 💳(CRM) | Add note. |
| PATCH | `/customers/:id/notes/:noteId` | 🔒 💳(CRM) | Edit note (audit‑logged). |
| GET | `/customers/:id/risk` | 🔒 💳(COD_RISK) | Explainable risk breakdown. |

## Reminders — `/api/reminders` 💳(CRM)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/reminders` | List (filters `status`, `due=today\|overdue`; paginated). |
| POST | `/reminders` | `{title, dueAt, customerId?}`. |
| PATCH | `/reminders/:id` | `{title?, dueAt?, status?}` — complete/reschedule. |
| DELETE | `/reminders/:id` | Remove → `204`. |

## Dashboard — `/api/dashboard` 🔒 💳(DASHBOARD)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/dashboard/summary` | Today's orders (count+value), COD pending, follow‑ups due, month revenue, pipeline counts. |
| GET | `/dashboard/revenue` | 30‑day daily revenue series (gap‑filled). |

## Plan — `/api/plan`

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/plan` | 🔒 | `{plan, planStatus, label, limits, features, usage}`. |
| GET | `/plan/catalog` | — | Public pricing catalog (all tiers with limits + features). |

## System

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/health` | — | `{status, db, metaConfigured, metaTestMode, uptime, timestamp}`; 503 if DB down. |
| GET | `/activity` | 🔒 | Audit log (paginated). |
| GET | `/events` | token query | SSE stream of tenant events (`message.new`, `message.sent`, `message.failed`, `order.created`, `order.updated`). |
| GET | `/docs` · `/docs.json` | — | Swagger UI / OpenAPI spec. |

---

### Example: capture an order linking a product

```bash
curl -X POST https://api.example.com/api/orders \
  -H "Authorization: Bearer $ACCESS" -H "Content-Type: application/json" \
  -d '{
    "items": [{ "productId": "665...", "productName": "Dhaka Topi", "qty": 2, "unitPriceNpr": 800 }],
    "phone": "9812345678",
    "customerName": "Sita Sharma",
    "address": "Kathmandu",
    "paymentType": "cod",
    "shippingNpr": 100
  }'
# → 201 { "data": { "order": { "orderNumber": "DKN-000016",
#          "items": [{ "product": "665...", "sku": "DKN-P-000006", "unitPricePaisa": 80000, ... }],
#          "totalPaisa": 170000, "status": "pending", ... } } }
```
