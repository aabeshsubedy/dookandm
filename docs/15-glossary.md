# 15 · Glossary

Domain and technical terms used across the codebase and docs.

## Domain

| Term | Meaning |
|------|---------|
| **Seller** | A user account = a **tenant**. Owns all their data. May have staff sub‑accounts. |
| **Tenant** | The data‑isolation boundary. For staff, the tenant is their owner (`parentSeller ?? _id`), exposed as `req.tenantId`. |
| **Channel** | A connected Facebook Page or Instagram business account the seller receives DMs/comments on. |
| **Conversation** | A normalized thread (DM or comment root) with one participant on one channel. |
| **Message** | A single inbound/outbound item within a conversation. |
| **Customer** | A CRM profile, keyed on phone number, that a conversation/order resolves to. |
| **Provisional customer** | A customer created from a channel handle before any phone is known; promoted/merged once a phone appears. |
| **Identity resolution** | Matching conversations and orders to one customer by normalized phone (primary) + channel handles (secondary). |
| **Order** | A structured purchase captured from a conversation, moving through the status pipeline. |
| **Order pipeline** | The status state machine: pending → confirmed → shipped → delivered → returned (+ cancelled). |
| **Product** | **[Products]** A catalog item with a per‑seller unique SKU, price, optional inventory. Internal catalog, not a storefront. |
| **SKU** | Stock‑Keeping Unit = the human‑facing **product ID** (unique per seller). |
| **COD** | Cash on Delivery — the customer pays when the parcel arrives. |
| **COD risk** | A rule‑based label (new/reliable/medium/risky) computed from the seller's own return history for a customer. |
| **Return rate** | `returned / (delivered + returned)` for a customer, within one seller. |
| **Reminder** | A date‑based follow‑up task, optionally attached to a customer. |
| **Plan / tier** | Free / Starter / Growth / Business — subscription levels with usage limits + feature flags. |
| **Quota** | A per‑plan numeric cap (orders/month, customers, products, channels, team logins). |
| **Paisa** | 1/100 of a Nepali Rupee (NPR). All money is stored as integer paisa. |
| **NPR** | Nepali Rupee. |

## Technical

| Term | Meaning |
|------|---------|
| **Monorepo** | One repository with multiple npm workspaces (`shared`, `server`, `client`). |
| **`shared`** | The `@dokaandm/shared` package: pure domain logic + Zod schemas + config, used by server, client, and tests. |
| **Access token** | Short‑lived (~15 min) JWT sent as a Bearer header; held in memory on the client. |
| **Refresh token** | Long‑lived (~7 day) opaque token in an httpOnly cookie; rotated on use; only its hash is stored. |
| **Token family** | A lineage of rotated refresh tokens; reusing a consumed one revokes the whole family (theft detection). |
| **Webhook** | A Meta HTTP callback delivering new message/comment events to the API. |
| **`X‑Hub‑Signature‑256`** | The HMAC‑SHA256 header Meta signs webhook bodies with; verified before processing. |
| **SSE** | Server‑Sent Events — the one‑way server→browser push channel used for real‑time updates. |
| **Envelope** | The response shape: `{data,…}` on success, `{error:{code,message}}` on failure. |
| **Middleware** | Express request‑pipeline functions (auth, validate, plan gates, rate limit, error). |
| **`requireFeature` / `enforceQuota`** | Plan‑enforcement middleware for feature flags and numeric caps. |
| **`riskCache`** | Denormalized COD‑risk fields stored on a customer, recomputed on order changes. |
| **Snapshot (order item)** | Copying a product's name/price/SKU onto an order line so later product edits don't rewrite history. |
| **Soft delete** | Marking a record archived/disconnected instead of removing it. |
| **TTL index** | A MongoDB index that auto‑expires documents (used for refresh tokens and webhook events). |
| **Idempotent** | Safe to run more than once with the same effect (webhook processing, seed, identity resolution). |
| **App Review** | Meta's approval process for advanced messaging permissions; the critical‑path dependency. |
| **Test mode (Meta)** | The ≤25‑account allowance for testing before App Review approval. |
| **Optimistic update** | Updating the UI before the server confirms, then reconciling (e.g. sending a reply). |
