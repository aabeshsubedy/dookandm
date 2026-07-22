# DokaanDM — Engineering Documentation

> **Omnichannel Inbox · Order Capture · Product Catalog · Lightweight CRM for Nepali social‑commerce sellers.**

This folder is the complete software‑engineering documentation set for DokaanDM — product, business logic, architecture, data, API, security, operations, and process. It is written to be readable by an engineer joining the project cold, and by a founder/stakeholder who wants to understand *why* the system behaves the way it does.

The product name `DokaanDM` is a **working name**, centralized in [`shared/src/brand.js`](../shared/src/brand.js) — changing it there rebrands the whole app.

---

## How this documentation is organized

| # | Document | Audience | What it answers |
|---|----------|----------|-----------------|
| — | [README](./README.md) (this file) | everyone | Where do I find X? |
| 01 | [Product Vision & Scope](./01-product-vision.md) | product, eng | What are we building, for whom, and what is out of scope? |
| 02 | [Business Logic & Domain Rules](./02-business-logic.md) | eng, product | The rules the software enforces (orders, identity, COD risk, inventory, money). |
| 03 | [Functional Requirements](./03-functional-requirements.md) | eng, QA | Testable feature‑level requirements. |
| 04 | [Non‑Functional Requirements](./04-non-functional-requirements.md) | eng, QA | Performance, security, reliability, accessibility targets. |
| 05 | [System Architecture](./05-system-architecture.md) | eng | Components, data flow, runtime topology, real‑time. |
| 06 | [Data Model](./06-data-model.md) | eng, data | Collections, fields, indexes, relationships (ERD). |
| 07 | [API Reference](./07-api-reference.md) | eng, integrators | Every endpoint, request/response, error codes. |
| 08 | [Security](./08-security.md) | eng, security | Controls, threat model, auth flows, secrets. |
| 09 | [Pricing & Plan Enforcement](./09-pricing-and-plans.md) | product, eng | Tiers, limits, how they're enforced, business rationale. |
| 10 | [Testing Strategy](./10-testing-strategy.md) | eng, QA | What we test, how, and why. |
| 11 | [Deployment & Operations](./11-deployment-operations.md) | eng, ops | Deploy steps, runbook, observability, scaling. |
| 12 | [Developer Guide](./12-developer-guide.md) | eng | Local setup, workflow, scripts, conventions. |
| 13 | [Coding Standards](./13-coding-standards.md) | eng | Style, patterns, do/don't. |
| 14 | [Architecture Decision Records](./14-architecture-decision-records.md) | eng | Why key technical choices were made. |
| 15 | [Glossary](./15-glossary.md) | everyone | Domain and technical terms. |
| 16 | [Roadmap & Fast‑Follows](./16-roadmap.md) | product, eng | What's deliberately deferred and when to revisit. |

### Related root documents
- [`../PRODUCT_SPEC.md`](../PRODUCT_SPEC.md) — the original build spec (single source of truth for the initial build; this docs set expands and supersedes it for day‑to‑day reference).
- [`../README.md`](../README.md) — quick start.
- [`../DEPLOYMENT.md`](../DEPLOYMENT.md) — deployment quick reference.
- Live API docs (Swagger UI): `http://localhost:4000/api/docs` when the server is running.

---

## 30‑second system summary

- **Monorepo** (npm workspaces): `shared/` (domain logic + schemas), `server/` (Express + MongoDB API), `client/` (React SPA).
- Sellers connect **Facebook Pages / Instagram business accounts** via Meta OAuth; DMs & comments arrive over **webhooks** into one **unified inbox**.
- From any conversation, a seller **captures an order**, which resolves to a **customer** (by phone) and optionally links **catalog products**.
- Orders move through a **status pipeline**; the system computes a **rule‑based COD risk** signal per customer from that seller's own history.
- A **dashboard** aggregates the day; **plan tiers** (Free/Starter/Growth/Business) cap usage, enforced in middleware.
- **Multi‑tenant** from day one — every record is scoped to the owning seller.

## Documentation conventions

- **[Products]** tags mark the product‑catalog capability added after the initial MVP.
- Money is always **integer paisa** (NPR × 100) in code and storage; documents show NPR for readability.
- Mermaid diagrams are embedded inline (render on GitHub and most Markdown viewers).
- When code and docs disagree, **code is truth** — please open a change to reconcile.
