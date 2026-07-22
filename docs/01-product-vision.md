# 01 · Product Vision & Scope

## 1. The problem

Nepali social‑commerce sellers run their businesses inside **Facebook and Instagram DMs and comments**. A typical seller:

- Handles **100+ near‑identical questions a day** scattered across Messenger, Instagram DMs, and post comments — juggling multiple app tabs and losing track of who they already replied to.
- Manages **15–20 active custom orders purely from memory and scrollback** in chat threads. There is no structured record of what was ordered, by whom, for how much, or what stage it's at.
- Has **no memory of the customer relationship** — "this person bought twice before, follow up when new stock arrives" lives only in the seller's head and doesn't scale past a handful of repeat buyers.
- Bleeds money on **cash‑on‑delivery (COD) returns and refusals**. In the comparable Indian market, COD return‑to‑origin rates run as high as 30%; each one costs outbound + return shipping with zero revenue.

## 2. The product

DokaanDM is a **web‑first operations tool** that meets sellers where they already sell. It does the two things a storefront‑first tool under‑serves:

1. **Fast, reliable order capture** from a conversation.
2. **Remembering the customer** over time — including flagging risky COD orders before they ship.

### Positioning
Unlike existing Nepal‑market tools (e.g. Saney) that push sellers toward a **branded storefront**, DokaanDM does **not** run a storefront. It layers onto the seller's existing Facebook/Instagram presence. This is a deliberate cost and focus advantage: no storefront hosting, no AI inference bills, no payment gateway to maintain — which is why it can be priced meaningfully below the market anchor.

## 3. Target users (personas)

| Persona | Description | Primary needs |
|---------|-------------|---------------|
| **Solo seller (primary)** | Runs a one‑person shop via FB + IG DMs, 10–50 orders/week. | One inbox, quick order capture, remember repeat customers, avoid bad COD. |
| **Growing seller** | Has a helper answering DMs, multiple pages/sub‑brands. | Multiple channels, team logins, higher volume, a dashboard. |
| **Pilot cohort** | 5–10 real sellers recruited to validate the product. | Low friction, obvious value in week 2+, willingness to pay. |

## 4. Product principles

1. **Meet sellers where they are** — the channel is the DM, not a website.
2. **Capture beats configuration** — turning a chat into an order must take seconds.
3. **Memory is the moat** — the CRM + COD‑risk layer is the differentiator, not the inbox alone.
4. **Solo‑founder maintainable** — favor managed services and simple, boring technology.
5. **Multi‑tenant and safe by default** — a seller can only ever see their own data.

## 5. Feature set (v1 + post‑v1)

**In scope / built:**

- Unified Facebook + Instagram inbox (real Meta Graph API + webhooks, OAuth 2.0).
- Order capture from a conversation, with a status pipeline.
- **Product catalog with inventory** (post‑v1 addition; searchable by name and product ID). **[Products]**
- Customer profiles / lightweight CRM (phone‑number identity resolution, notes, tags, reminders).
- COD risk flagging (rule‑based, from the seller's own history — no ML).
- Order & business dashboard.
- Pricing‑tier limit enforcement (Free / Starter / Growth / Business).
- Multi‑tenant data isolation.

**Explicitly OUT of scope** (deliberately deferred — see [16 · Roadmap](./16-roadmap.md)):

| Deferred | Why not now |
|----------|-------------|
| WhatsApp integration | Prove the FB/IG core first; different API surface. |
| TikTok integration | Same. |
| AI auto‑reply chatbot | Adds inference cost + trust risk before value is proven. |
| Payment gateway (eSewa/Khalti) | No transaction‑fee revenue lever in MVP; keep it a clean subscription. |
| Storefront / website / custom domain | The core positioning is *no storefront*. |

> **Rule for engineers:** if a deferred item looks like the "easy" way to solve something, **stop and flag it** rather than building it.

## 6. Success signals (validation)

The product is validated if, during a 2–3 week pilot with 5–10 real sellers:

- Sellers keep using the **CRM / COD‑risk** features unprompted after week 2 (not just first‑day novelty).
- Sellers would **pay** a price meaningfully below the NPR 2,499/month market anchor.

If sellers only touch the inbox and ignore the CRM layer, that is equally valuable information — it means leaning harder into the lightweight inbox+orders tool and shrinking CRM scope.

## 7. The critical path (business dependency)

**Meta App Review** for Instagram/Facebook messaging permissions (`instagram_business_manage_messages`) is the single longest external dependency — typically **4–6 weeks**, requiring **Business Verification** and a screencast of the working app. It should be submitted as early as a basic inbox works end‑to‑end. Meanwhile, the product can be piloted with up to **25 test users** without App Review (see [08 · Security](./08-security.md) and [11 · Operations](./11-deployment-operations.md)).
