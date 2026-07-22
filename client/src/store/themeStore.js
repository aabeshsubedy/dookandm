import { create } from 'zustand';
import {
  BRAND_COLORS,
  DEFAULT_BRAND_COLOR,
  getBrandColor,
  isValidBrandColor,
} from '../lib/brandColors.js';

const THEME_KEY = 'dokaandm-theme';
const ACCENT_KEY = 'dokaandm-accent';

function getSystemPrefersDark() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveTheme(theme) {
  if (theme === 'system') return getSystemPrefersDark() ? 'dark' : 'light';
  return theme;
}

function applyBrandVars(accentId, resolved) {
  const palette = getBrandColor(accentId);
  const mode = resolved === 'dark' ? palette.dark : palette.light;
  const root = document.documentElement;
  root.style.setProperty('--brand', mode.brand);
  root.style.setProperty('--brand-hover', mode.hover);
  root.style.setProperty('--brand-active', mode.active);
  root.style.setProperty('--brand-soft', mode.soft);
  root.style.setProperty('--brand-fg', '255 255 255');
  root.dataset.accent = palette.id;
}

function applyDomTheme(resolved, accentId) {
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
  root.dataset.theme = resolved;
  applyBrandVars(accentId, resolved);
}

function readStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    /* ignore */
  }
  return 'system';
}

function readStoredAccent() {
  try {
    const stored = localStorage.getItem(ACCENT_KEY);
    if (stored && isValidBrandColor(stored)) return stored;
  } catch {
    /* ignore */
  }
  return DEFAULT_BRAND_COLOR;
}

const initialPreference = typeof window !== 'undefined' ? readStoredTheme() : 'system';
const initialAccent = typeof window !== 'undefined' ? readStoredAccent() : DEFAULT_BRAND_COLOR;
const initialResolved =
  typeof window !== 'undefined' ? resolveTheme(initialPreference) : 'light';

if (typeof window !== 'undefined') {
  applyDomTheme(initialResolved, initialAccent);
}

export const useThemeStore = create((set, get) => ({
  /** User preference: 'light' | 'dark' | 'system' */
  theme: initialPreference,
  /** Effective theme after resolving system preference */
  resolved: initialResolved,
  /** Brand accent id */
  accent: initialAccent,
  /** Catalog for UI pickers */
  accents: BRAND_COLORS,

  setTheme: (theme) => {
    const { accent } = get();
    const resolved = resolveTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
    applyDomTheme(resolved, accent);
    set({ theme, resolved });
  },

  setAccent: (accentId) => {
    const accent = isValidBrandColor(accentId) ? accentId : DEFAULT_BRAND_COLOR;
    const { resolved } = get();
    try {
      localStorage.setItem(ACCENT_KEY, accent);
    } catch {
      /* ignore */
    }
    applyBrandVars(accent, resolved);
    set({ accent });
  },

  toggle: () => {
    const { resolved } = get();
    const next = resolved === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  /** Re-resolve when OS preference changes while on system mode */
  syncSystem: () => {
    const { theme, accent } = get();
    if (theme !== 'system') return;
    const resolved = resolveTheme('system');
    applyDomTheme(resolved, accent);
    set({ resolved });
  },
}));

/** Call once at app boot to listen for OS theme changes. */
export function initThemeListener() {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => useThemeStore.getState().syncSystem();
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}
