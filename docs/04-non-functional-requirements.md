# 04 · Non‑Functional Requirements

Quality attributes and constraints. Where a requirement is verifiable, the "How it's met / verified" column points at the mechanism.

## 1. Security

| ID | Requirement | How it's met / verified |
|----|-------------|-------------------------|
| NFR‑SEC1 | Passwords hashed with bcrypt cost ≥ 12; never returned/logged. | `authService.js`; `passwordHash` is `select:false`; log redaction. |
| NFR‑SEC2 | Short‑lived access tokens + rotating httpOnly refresh with reuse detection. | `tokenService.js`; `auth.test.js` reuse test. |
| NFR‑SEC3 | Meta OAuth tokens encrypted at rest (AES‑256‑GCM). | `lib/crypto.js`; `pageAccessTokenEnc` is `select:false`. |
| NFR‑SEC4 | Webhook signature verification (`X‑Hub‑Signature‑256`); reject unverified. | `metaService.verifyWebhookSignature`. |
| NFR‑SEC5 | Rate limiting on auth + webhook + general API. | `middleware/rateLimit.js`. |
| NFR‑SEC6 | Input validated/sanitized server‑side on every endpoint (never trust the client). | Zod schemas + `validate` middleware; `String()` coercion of query filters. |
| NFR‑SEC7 | NoSQL‑operator‑injection safe. | Zod → primitives; `escapeRegex`/`mongoose.trusted` for search; `sanitizeFilter` deliberately off (see [ADR‑007](./14-architecture-decision-records.md)). |
| NFR‑SEC8 | HTTP security headers + explicit CORS allowlist (no wildcards). | Helmet; `cors` allowlist in `app.js`. |
| NFR‑SEC9 | Strict multi‑tenant isolation. | `req.tenantId` scoping; `tenant.test.js`. |
| NFR‑SEC10 | No secrets in the repo; documented `.env.example`. | `.gitignore`; env schema validated at boot. |
| NFR‑SEC11 | Errors never leak stack traces/internals in production. | Central error handler. |

See [08 · Security](./08-security.md) for the full model.

## 2. Performance

| ID | Requirement | Notes |
|----|-------------|-------|
| NFR‑PERF1 | Inbox is the most‑used screen and must feel instant. | Indexed list query; SSE push; optimistic reply. |
| NFR‑PERF2 | Every list endpoint is paginated (default 25, max 100). | No unbounded queries. |
| NFR‑PERF3 | Every query pattern the app uses has a supporting index. | See [06 · Data Model](./06-data-model.md). |
| NFR‑PERF4 | Near‑real‑time message delivery. | Webhooks + SSE, not polling. |
| NFR‑PERF5 | Client initial bundle kept lean. | Route‑level code‑splitting; heavy charts (Recharts) load with the dashboard. |
| NFR‑PERF6 | Dashboard uses aggregation queries, not per‑document scans. | Mongo aggregation pipelines. |

## 3. Reliability & availability

| ID | Requirement | Notes |
|----|-------------|-------|
| NFR‑REL1 | Meta must never time out a webhook. | Ack 200 immediately, process async. |
| NFR‑REL2 | Duplicate webhook deliveries are safe. | `webhookevents` dedupe + TTL. |
| NFR‑REL3 | Outbound over the rate cap is queued, not lost. | Message queue with back‑off. |
| NFR‑REL4 | Graceful shutdown drains in‑flight requests. | SIGTERM/SIGINT handlers. |
| NFR‑REL5 | Health endpoint for uptime monitoring. | `/api/health` with DB ping. |
| NFR‑REL6 | Best‑effort audit logging never breaks primary ops. | try/catch around `recordActivity`. |

## 4. Observability

| ID | Requirement | Notes |
|----|-------------|-------|
| NFR‑OBS1 | Structured JSON logs. | pino. |
| NFR‑OBS2 | Every request carries a correlation id. | `x-request-id` (generated if absent). |
| NFR‑OBS3 | Secrets/tokens are redacted in logs. | pino `redact` paths. |
| NFR‑OBS4 | Errors logged with request context; client errors at warn, server at error. | Central error handler + pino‑http levels. |

## 5. Usability & UX

| ID | Requirement | Notes |
|----|-------------|-------|
| NFR‑UX1 | Feels like a real SaaS product (Linear/Notion‑level polish), not default components. | Custom design system. |
| NFR‑UX2 | Loading, empty, and error states for every screen. | Skeletons, custom empty states, toasts. |
| NFR‑UX3 | Optimistic UI where it improves perceived speed. | Reply send, order status. |
| NFR‑UX4 | Mobile‑responsive (web is the primary surface). | Responsive layouts; mobile card variants. |
| NFR‑UX5 | Light + dark theme. | CSS‑variable design tokens. |

## 6. Accessibility

| ID | Requirement | Notes |
|----|-------------|-------|
| NFR‑A11Y1 | Sufficient contrast for text and controls. | Token palette tuned for both themes. |
| NFR‑A11Y2 | Semantic HTML and ARIA labels on icon‑only controls. | Buttons/inputs/dialogs. |
| NFR‑A11Y3 | Full keyboard navigation and visible focus states. | Focus‑visible ring; inbox shortcuts. |

## 7. Maintainability

| ID | Requirement | Notes |
|----|-------------|-------|
| NFR‑MNT1 | Shared domain logic lives once, used by client/server/tests. | `shared/` workspace. |
| NFR‑MNT2 | Consistent lint + format across workspaces. | ESLint + Prettier. |
| NFR‑MNT3 | Solo‑founder operable — minimal moving parts. | Managed DB/host; in‑process queue for MVP. |
| NFR‑MNT4 | Core differentiators are unit‑tested. | Risk + identity resolution. |

## 8. Portability & compatibility

| ID | Requirement | Notes |
|----|-------------|-------|
| NFR‑PORT1 | Runs on Node ≥ 18.18 (ESM). | `engines` in root `package.json`. |
| NFR‑PORT2 | Deployable to common PaaS + MongoDB Atlas. | Env‑driven config; `trust proxy`. |
| NFR‑PORT3 | Meta integration is env‑gated; app runs fully on seed data without live Meta. | `META_*` optional. |

## 9. Compliance & data

| ID | Requirement | Notes |
|----|-------------|-------|
| NFR‑DATA1 | Store only what the workflow needs (contacts, orders, notes). | No card/payment data ever. |
| NFR‑DATA2 | Meta tokens are the most sensitive stored data → encrypted at rest. | AES‑256‑GCM. |
| NFR‑DATA3 | Follow Meta Platform Terms (permitted use of messaging data). | App Review scope. |
