# 16 · Roadmap & Fast‑Follows

What's deliberately deferred, in what order to consider it, and what should be revisited once real usage data exists. **Nothing here should be built without an explicit decision** — the MVP's discipline is to prove the core before expanding.

## 1. Gate: validate the MVP first

Before investing in anything below, run the pilot (5–10 real sellers, 2–3 weeks) and check the two core assumptions:

1. **CRM/COD‑risk value** — do sellers keep using notes/tags/reminders/risk unprompted after week 2, and would they pay for it (distinct from just organizing the inbox)?
2. **Storefront‑indifference** — do sellers specifically *not* want a storefront (validating the positioning), or would they take a free one?

Outcomes steer the roadmap:
- **CRM sticks + willingness to pay** → build on the differentiators (deeper CRM, shared COD signal).
- **Only the inbox is used** → lean into the lightweight inbox+orders tool; shrink CRM scope.

## 2. Fast‑follows (explicitly out of MVP scope)

| Item | Why deferred | When to revisit | Notes |
|------|--------------|-----------------|-------|
| **WhatsApp integration** | Prove FB/IG core first; different API + pricing (Meta conversation fees). | After pilot validates order‑capture value. | Reuse the normalized conversation/message schema; new channel type. |
| **TikTok integration** | Same rationale. | After WhatsApp, based on seller demand. | |
| **AI auto‑reply chatbot** | Adds inference cost + trust risk before value is proven. | Once inbox volume + FAQ patterns are known. | Start with suggested replies, not full autonomy. |
| **Payment gateway (eSewa/Khalti)** | No transaction‑fee lever in MVP; keeps pricing a clean subscription. | When sellers ask to collect prepayment (reduces COD risk directly). | Opens a **transaction‑fee** monetization lever → revisit pricing tiers. |
| **Storefront / website / custom domain** | Core positioning is *no storefront*. | Only if validation shows sellers actually want it. | Would be a strategic pivot, not a feature. |

## 3. Strong v2 candidates (extend existing differentiators)

- **COD risk v2:** OTP verification before COD confirmation; a **cross‑seller shared risk signal** (a customer risky for many sellers) — powerful once there's real multi‑seller order data. Requires careful privacy design.
- **Deeper CRM:** customer segments, bulk follow‑ups, saved reply snippets.
- **Product v2:** low‑stock alerts on the dashboard, best‑seller analytics, product images upload (vs URL), bulk import (CSV in), variants/options.
- **Team & roles:** proper staff invites, per‑role permissions (the schema already supports `owner`/`staff` + `parentSeller`).

## 4. Platform / engineering hardening (as usage grows)

- **Scale the seams (ADR‑006):** move the outbound queue to BullMQ/Redis and the SSE broker to Redis pub/sub for multi‑instance; back the rate limiter with Redis.
- **Billing:** integrate a subscription provider and wire `planStatus`/`planRenewsAt` (fields already reserved).
- **CI/CD:** wire lint → test → build → deploy (see [10 §7](./10-testing-strategy.md)).
- **Frontend tests:** Playwright e2e for the inbox → order → customer happy path.
- **Webhook backfill/sync:** implement the Graph API conversation backfill (currently a no‑op acknowledgement in dev) for a full history on connect.
- **Auth completeness:** email verification + password reset.
- **Observability:** ship logs/metrics to an aggregator; add basic dashboards + alerts on `/api/health` and error rates.
- **Data:** per‑tenant export/delete for data‑subject requests as the user base grows.

## 5. Explicitly *not* planned

- A public marketplace/storefront.
- Multi‑currency (Nepal‑first; NPR only).
- Native mobile apps beyond the noted future Flutter **companion** (web remains the primary surface).

---

_This roadmap is a set of options, not commitments. Revisit it after each pilot cohort with fresh data._
