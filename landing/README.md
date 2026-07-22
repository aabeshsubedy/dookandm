# DokaanDM Landing (static)

Production marketing page in **pure HTML, CSS, and vanilla JavaScript** — no build step, no React.

## Preview

From the repo root:

```bash
# any static server, e.g.
npx serve landing
# or
cd landing && python3 -m http.server 8080
```

Then open `http://localhost:3000` (or `8080`).

You can also open `landing/index.html` directly in a browser (theme + interactions still work).

## Files

| File | Role |
|------|------|
| `index.html` | Full page structure, product mocks, pricing, FAQ |
| `styles.css` | Design system (Ocean blue tokens, light/dark, layout) |
| `script.js` | Theme toggle, mobile nav, FAQ, billing toggle, chart |
| `favicon.svg` | Brand favicon |

## Design

- Default accent: **Ocean blue** (`#2563EB` / RGB `37 99 235`)
- Light / dark via `html.dark` + `localStorage` key `dokaandm-landing-theme`
- Mirrors product docs: inbox, orders, COD risk, CRM, catalog, dashboard, plans

## CTAs

Sign-in / start-free links point at `../client/` (the React app). Adjust hrefs if you deploy the landing and app on separate hosts.
