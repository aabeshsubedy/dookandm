/**
 * DokaanDM Landing — vanilla JS
 * Theme toggle · mobile nav · FAQ accordion · billing toggle · chart bars
 */

(function () {
  'use strict';

  const THEME_KEY = 'dokaandm-landing-theme';

  /* ── Theme ───────────────────────────────────────────────────────────── */

  function getStoredTheme() {
    try {
      return localStorage.getItem(THEME_KEY) || 'system';
    } catch {
      return 'system';
    }
  }

  function resolveTheme(preference) {
    if (preference === 'dark') return 'dark';
    if (preference === 'light') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(preference) {
    const resolved = resolveTheme(preference);
    document.documentElement.classList.toggle('dark', resolved === 'dark');

    const sun = document.querySelector('.icon-sun');
    const moon = document.querySelector('.icon-moon');
    if (sun && moon) {
      // Show sun when dark (click → light); moon when light (click → dark)
      sun.hidden = resolved !== 'dark';
      moon.hidden = resolved === 'dark';
    }

    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.setAttribute(
        'aria-label',
        resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      );
    }
  }

  function cycleTheme() {
    const current = getStoredTheme();
    const resolved = resolveTheme(current);
    // Toggle light ↔ dark (persist explicit choice)
    const next = resolved === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignore */
    }
    applyTheme(next);
  }

  /* ── Header scroll ───────────────────────────────────────────────────── */

  function initHeaderScroll() {
    const header = document.getElementById('site-header');
    if (!header) return;

    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ── Mobile menu ─────────────────────────────────────────────────────── */

  function initMobileMenu() {
    const toggle = document.getElementById('menu-toggle');
    const panel = document.getElementById('mobile-panel');
    if (!toggle || !panel) return;

    const menuIcon = toggle.querySelector('.icon-menu');
    const closeIcon = toggle.querySelector('.icon-close');

    function isOpen() {
      return panel.classList.contains('is-open');
    }

    function setOpen(open) {
      panel.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (menuIcon) menuIcon.hidden = open;
      if (closeIcon) closeIcon.hidden = !open;
    }

    toggle.addEventListener('click', () => {
      setOpen(!isOpen());
    });

    panel.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setOpen(false));
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) setOpen(false);
    });
  }

  /* ── Smooth anchor scroll (offset for sticky header) ─────────────────── */

  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const id = anchor.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const headerH = document.getElementById('site-header')?.offsetHeight || 64;
        const top = target.getBoundingClientRect().top + window.scrollY - headerH - 8;
        window.scrollTo({ top, behavior: 'smooth' });
        history.pushState(null, '', id);
      });
    });
  }

  /* ── FAQ accordion ───────────────────────────────────────────────────── */

  function initFaq() {
    const list = document.getElementById('faq-list');
    if (!list) return;

    list.querySelectorAll('.faq-trigger').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const isOpen = item.classList.contains('is-open');

        // Close all
        list.querySelectorAll('.faq-item').forEach((el) => {
          el.classList.remove('is-open');
          el.querySelector('.faq-trigger')?.setAttribute('aria-expanded', 'false');
        });

        // Open clicked if it was closed
        if (!isOpen) {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ── Pricing billing toggle ──────────────────────────────────────────── */

  function initBillingToggle() {
    const monthlyBtn = document.getElementById('billing-monthly');
    const annualBtn = document.getElementById('billing-annual');
    if (!monthlyBtn || !annualBtn) return;

    let annual = false;

    function update() {
      monthlyBtn.classList.toggle('is-active', !annual);
      annualBtn.classList.toggle('is-active', annual);

      document.querySelectorAll('[data-price-monthly]').forEach((el) => {
        el.textContent = annual
          ? el.getAttribute('data-price-annual')
          : el.getAttribute('data-price-monthly');
      });

      document.querySelectorAll('[data-sub-monthly]').forEach((el) => {
        el.textContent = annual
          ? el.getAttribute('data-sub-annual')
          : el.getAttribute('data-sub-monthly');
      });
    }

    monthlyBtn.addEventListener('click', () => {
      annual = false;
      update();
    });
    annualBtn.addEventListener('click', () => {
      annual = true;
      update();
    });
  }

  /* ── Chart bars ──────────────────────────────────────────────────────── */

  function initChart() {
    const container = document.getElementById('chart-bars');
    if (!container) return;

    const heights = [
      40, 55, 35, 70, 50, 85, 60, 75, 45, 90, 65, 80, 55, 95, 70, 60, 88, 72, 50, 92, 68, 78, 58, 84,
      76, 62, 90, 70, 85, 95,
    ];

    const frag = document.createDocumentFragment();
    heights.forEach((h) => {
      const bar = document.createElement('span');
      bar.style.height = h + '%';
      bar.style.opacity = String(0.4 + (h / 100) * 0.6);
      frag.appendChild(bar);
    });
    container.appendChild(frag);
  }

  /* ── Footer year ─────────────────────────────────────────────────────── */

  function initYear() {
    const el = document.getElementById('year');
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ── System theme listener ───────────────────────────────────────────── */

  function initSystemThemeListener() {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (getStoredTheme() === 'system') applyTheme('system');
    };
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else if (mq.addListener) mq.addListener(handler);
  }

  /* ── Boot ────────────────────────────────────────────────────────────── */

  function boot() {
    applyTheme(getStoredTheme());
    initHeaderScroll();
    initMobileMenu();
    initSmoothAnchors();
    initFaq();
    initBillingToggle();
    initChart();
    initYear();
    initSystemThemeListener();

    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', cycleTheme);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
