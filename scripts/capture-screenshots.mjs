/**
 * Capture DokaanDM product screenshots (light + dark) for the marketing landing.
 *
 *   BASE_URL=http://localhost:5175 node scripts/capture-screenshots.mjs
 */
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDirs = [
  path.join(root, 'client/public/screenshots'),
  path.join(root, 'landing/screenshots'),
];
const BASE = process.env.BASE_URL || 'http://localhost:5175';

for (const dir of outDirs) fs.mkdirSync(dir, { recursive: true });

async function setInput(page, selector, value) {
  const loc = page.locator(selector).first();
  await loc.waitFor({ state: 'visible' });
  await loc.evaluate((el, v) => {
    const desc = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
    desc.set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  // Already authed → app redirects away from /login
  if (!page.url().includes('login')) {
    console.log('already authed →', page.url());
    return;
  }
  const email = page.locator('input[type="email"]');
  if ((await email.count()) === 0) {
    console.log('no login form (session warm) →', page.url());
    return;
  }
  await email.waitFor({ state: 'visible', timeout: 10000 });
  await setInput(page, 'input[type="email"]', 'demo@dokaandm.app');
  await setInput(page, 'input[type="password"]', 'password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(2500);
  if (page.url().includes('login')) {
    throw new Error('Login failed — still on /login');
  }
  console.log('logged in →', page.url());
}

async function applyTheme(page, mode) {
  await page.emulateMedia({ colorScheme: mode });
  await page.evaluate((m) => {
    const root = document.documentElement;
    const dark = m === 'dark';
    root.classList.toggle('dark', dark);
    root.style.colorScheme = m;
    root.dataset.theme = m;
    localStorage.setItem('dokaandm-theme', m);
    const accents = {
      blue: {
        light: { b: '37 99 235', h: '29 78 216', a: '30 64 175', s: '239 246 255' },
        dark: { b: '59 130 246', h: '96 165 250', a: '37 99 235', s: '23 37 84' },
      },
    };
    const modeVars = dark ? accents.blue.dark : accents.blue.light;
    root.style.setProperty('--brand', modeVars.b);
    root.style.setProperty('--brand-hover', modeVars.h);
    root.style.setProperty('--brand-active', modeVars.a);
    root.style.setProperty('--brand-soft', modeVars.s);
    root.style.setProperty('--brand-fg', '255 255 255');
  }, mode);
  await page.waitForTimeout(400);
}

async function shot(page, name) {
  // Sanity: must be inside the app shell (sidebar nav), not marketing landing
  const isApp = (await page.locator('aside, [class*="sidebar"]').count()) > 0
    || (await page.getByText('OVERVIEW', { exact: false }).count()) > 0
    || (await page.getByText('Namaste', { exact: false }).count()) > 0
    || page.url().includes('/inbox')
    || page.url().includes('/orders')
    || page.url().includes('/products')
    || page.url().includes('/customers');

  const isLanding = (await page.getByText('Start free').count()) > 0
    && (await page.getByText('Sell where your customers').count()) > 0;

  if (isLanding || !isApp) {
    console.warn('  ⚠ skip', name, '— not in app shell (url=', page.url(), ')');
    return false;
  }

  await page.waitForTimeout(500);
  const file = `${name}.png`;
  // Crop out the left sidebar (expanded rail is w-60 = 240px CSS)
  const clip = { x: 240, y: 0, width: 1440 - 240, height: 900 };
  for (const dir of outDirs) {
    await page.screenshot({
      path: path.join(dir, file),
      type: 'png',
      animations: 'disabled',
      clip,
    });
  }
  console.log('  ✓', file, '(no sidebar)');
  return true;
}

async function go(page, p) {
  await page.goto(`${BASE}${p}`, { waitUntil: 'load' });
  await page.waitForTimeout(1600);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  colorScheme: 'light',
});
const page = await context.newPage();
page.setDefaultTimeout(25000);

await page.addInitScript(() => {
  localStorage.setItem('dokaandm-theme', 'light');
  localStorage.setItem('dokaandm-accent', 'blue');
});

console.log('BASE', BASE);

const pages = [
  {
    key: 'dashboard',
    path: '/',
    prepare: async () => {
      await page.getByText('Namaste', { exact: false }).waitFor({ timeout: 10000 }).catch(() => {});
    },
  },
  {
    key: 'inbox',
    path: '/inbox',
    prepare: async () => {
      const rows = page.locator('[role="listbox"] button, ul li button');
      if ((await rows.count()) > 0) {
        await rows.first().click().catch(() => {});
        await page.waitForTimeout(900);
      }
    },
  },
  {
    key: 'orders',
    path: '/orders',
    prepare: async () => {
      const board = page.getByRole('tab', { name: /board/i });
      if (await board.count()) await board.click().catch(() => {});
      await page.waitForTimeout(700);
    },
  },
  { key: 'products', path: '/products', prepare: async () => {} },
  { key: 'customers', path: '/customers', prepare: async () => {} },
];

for (const mode of ['light', 'dark']) {
  console.log(`\n── ${mode.toUpperCase()} ──`);
  // Fresh login each mode so access token is warm
  await page.addInitScript((m) => {
    localStorage.setItem('dokaandm-theme', m);
    localStorage.setItem('dokaandm-accent', 'blue');
  }, mode);
  await login(page);
  await applyTheme(page, mode);

  for (const p of pages) {
    await go(page, p.path);
    await applyTheme(page, mode);
    await p.prepare();
    await page.waitForTimeout(500);
    const ok = await shot(page, `${p.key}-${mode}`);
    if (!ok) {
      // one retry after re-login
      await login(page);
      await applyTheme(page, mode);
      await go(page, p.path);
      await applyTheme(page, mode);
      await p.prepare();
      await shot(page, `${p.key}-${mode}`);
    }
  }
}

await browser.close();
console.log('\nDone →', outDirs[0]);
