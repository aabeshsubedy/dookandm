# DokaanDM Landing (static HTML / CSS / JS)

Standalone marketing site — **no React, no build step**.

## Open it

```bash
# Option A: open the file directly
open landing/index.html

# Option B: local server (recommended)
cd landing && python3 -m http.server 8080
# → http://localhost:8080
```

## Files

| File | Purpose |
|------|---------|
| `index.html` | Full page structure |
| `styles.css` | Design system + layout |
| `script.js` | Theme toggle, mobile nav, FAQ, pricing, screenshot theme swap |
| `screenshots/*-light.png` / `*-dark.png` | Real app screenshots (no sidebar) |
| `favicon.svg` | Favicon |

## Theme

Light / dark toggle is in the header. Product screenshots switch with the theme (`*-light.png` / `*-dark.png`).

Preference is stored in `localStorage` as `dokaandm-landing-theme`.

## CTAs

Sign-in / Start free link to `../client/` (the React app). Change those `href`s for production hosting.

## Refresh screenshots

From the monorepo root (app running, demo seeded):

```bash
BASE_URL=http://localhost:5175 node scripts/capture-screenshots.mjs
# then copy client/public/screenshots/*-{light,dark}.png → landing/screenshots/
```
