# 13 · Coding Standards

Conventions that keep the codebase consistent and safe. Enforced by ESLint + Prettier where possible; the rest is review discipline.

## 1. Language & modules

- **ESM everywhere** (`"type": "module"`). Use `import`/`export`, `.js`/`.jsx` extensions in relative imports.
- Node ≥ 18.18. Use built‑in `fetch`, `crypto`, `node:` prefixes for core modules.
- Prefer small, single‑purpose modules. Services orchestrate; routes stay thin; models hold schema only.

## 2. Formatting (Prettier)

- Single quotes, semicolons, trailing commas (es5), width 100, 2‑space indent, always‑parens arrows.
- Run `npm run format`; don't hand‑format against the config.

## 3. Linting (ESLint flat config)

- Server: `eslint.recommended` + Node globals; `no-unused-vars` warns (prefix intentional unused with `_`).
- Client: + `react` and `react-hooks` recommended; `react/prop-types` off (no PropTypes), `react/react-in-jsx-scope` off.
- Keep the tree **warning‑clean** before committing (the current tree is clean apart from pre‑existing files noted in review).

## 4. Backend patterns

- **Every route handler** is wrapped in `asyncHandler` so rejections reach the central error handler. Never `try/catch` just to `res.status(500)`.
- **Throw `ApiError`** for expected failures: `ApiError.badRequest/unauthorized/forbidden/notFound/conflict(...)`. Don't hand‑craft error responses.
- **Responses** use `ok(res, data, status?)` / `paginated(res, items, {page,limit,total})` — never build the envelope inline.
- **Validation** is a `validate(schema, source)` middleware using a shared Zod schema — never validate ad hoc inside a handler.
- **Tenancy:** every query includes `seller: req.tenantId`. No exceptions. Foreign records → `ApiError.notFound`.
- **Money** is integer paisa in models/services; convert rupees↔paisa only at the API boundary.
- **Search filters** from query params: coerce to primitives (`String(x)`) and use `containsRegex()` for text — never interpolate raw user input into a query object.
- **Secrets** (`passwordHash`, `pageAccessTokenEnc`) are `select:false`; add `.select('+field')` only where needed and strip via a `toSafeJSON()` method before returning.
- **Audit** sensitive mutations via `recordActivity(...)` (best‑effort; never block the primary op on it).
- **OpenAPI:** annotate each route with an `@openapi` JSDoc block so Swagger stays in sync.

### Naming
- Files: `resource.routes.js`, `resourceService.js`, `Model.js` (PascalCase model files), `camelCase` for everything else.
- Money fields end in `Paisa`. Booleans read as predicates (`isProvisional`, `trackInventory`).
- Enum vocabularies live in `shared/src/constants.js`, not scattered string literals.

## 5. Frontend patterns

- **Server state** lives in TanStack Query; **all** API calls go through `hooks/data.js` (one hook per operation). Don't call `api` directly from components.
- **Client state** is Zustand (`authStore`, `toastStore`); keep it minimal — derive from server state where possible.
- **Access token** stays in memory (never `localStorage`).
- **Styling** uses the semantic design tokens only — `bg-surface`, `text-fg`, `text-fg-muted`, `border-border`, `text-brand`, `bg-brand-soft`, `success/warning/danger(-soft)`. **Do not** hardcode hex colors or use the legacy `navy/ocean/teal` ramps in new code; they exist only for compatibility.
- **Components:** primitives in `components/ui`, domain badges in `components/common`, layout in `components/layout`, feature‑specific UI in `features/<feature>`.
- **Forms** use `react-hook-form`; reuse the shared Zod schemas via `@hookform/resolvers/zod` where a matching schema exists.
- **Feedback:** use the `toast` helper for background events; render loading (`Skeleton`/`LoadingPanel`), empty (`EmptyState`), and error states for every data view.
- **Gating:** wrap paid screens in `<UpgradeGate feature=…>`; check `planHasFeature` for inline gating. Never rely on hiding UI as the security boundary — the server enforces it.
- **Accessibility:** icon‑only buttons need `aria-label`; interactive rows are `<button>`/`<a>`, not click‑handlers on `<div>`; keep the focus ring.

## 6. Errors & logging

- Server: log via `req.log` (pino) with structured fields, not `console.log`. Client errors → `warn`, server → `error`.
- Never log secrets/tokens/passwords (redaction is configured, but don't rely on it — don't log them).
- Client: user‑facing errors go through `apiError(err)` → a toast; unexpected render crashes are caught by the `ErrorBoundary`.

## 7. Git & reviews

- Work on a branch; don't commit to the default branch directly.
- Keep changes scoped; update the relevant `docs/` page when behavior or the data model changes.
- A change is "done" when: lint clean, tests pass, the affected docs are updated, and (for server changes) the Swagger annotations reflect reality.
- Commit messages: imperative mood, explain the *why* when non‑obvious.

## 8. Dependencies

- Prefer the standard library and existing deps. New dependencies need a reason (weigh bundle size on the client, maintenance on the server).
- Don't add a dependency to do something a few lines of code already handle (the message queue, SSE broker, and toast system are intentionally hand‑rolled for the MVP).
