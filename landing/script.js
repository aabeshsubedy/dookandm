/**
 * DokaanDM static landing — theme, nav, FAQ, pricing, screenshot theme switch
 */
(function () {
  'use strict';

  var THEME_KEY = 'dokaandm-landing-theme';

  function getStoredTheme() {
    try {
      return localStorage.getItem(THEME_KEY) || 'system';
    } catch (e) {
      return 'system';
    }
  }

  function resolveTheme(pref) {
    if (pref === 'dark') return 'dark';
    if (pref === 'light') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(pref) {
    var resolved = resolveTheme(pref);
    var isDark = resolved === 'dark';
    document.documentElement.classList.toggle('dark', isDark);

    var sun = document.querySelector('.icon-sun');
    var moon = document.querySelector('.icon-moon');
    if (sun && moon) {
      sun.hidden = !isDark;
      moon.hidden = isDark;
    }

    var toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.setAttribute(
        'aria-label',
        isDark ? 'Switch to light mode' : 'Switch to dark mode'
      );
    }

    // Swap product screenshots
    document.querySelectorAll('.shot-viewport').forEach(function (vp) {
      var light = vp.querySelector('.shot-light');
      var dark = vp.querySelector('.shot-dark');
      if (!light || !dark) return;
      if (isDark) {
        light.classList.add('is-hidden');
        dark.classList.remove('is-hidden');
        dark.removeAttribute('aria-hidden');
        light.setAttribute('aria-hidden', 'true');
      } else {
        dark.classList.add('is-hidden');
        light.classList.remove('is-hidden');
        light.removeAttribute('aria-hidden');
        dark.setAttribute('aria-hidden', 'true');
      }
    });
  }

  function cycleTheme() {
    var current = resolveTheme(getStoredTheme());
    var next = current === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (e) {}
    applyTheme(next);
  }

  function initHeaderScroll() {
    var header = document.getElementById('site-header');
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initMobileMenu() {
    var toggle = document.getElementById('menu-toggle');
    var panel = document.getElementById('mobile-panel');
    if (!toggle || !panel) return;
    var menuIcon = toggle.querySelector('.icon-menu');
    var closeIcon = toggle.querySelector('.icon-close');

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

    toggle.addEventListener('click', function () {
      setOpen(!isOpen());
    });
    panel.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        setOpen(false);
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) setOpen(false);
    });
  }

  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var id = anchor.getAttribute('href');
        if (!id || id === '#') return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        var headerH = document.getElementById('site-header')
          ? document.getElementById('site-header').offsetHeight
          : 64;
        var top = target.getBoundingClientRect().top + window.scrollY - headerH - 8;
        window.scrollTo({ top: top, behavior: 'smooth' });
        if (history.pushState) history.pushState(null, '', id);
      });
    });
  }

  function initFaq() {
    var list = document.getElementById('faq-list');
    if (!list) return;
    list.querySelectorAll('.faq-trigger').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.faq-item');
        var wasOpen = item.classList.contains('is-open');
        list.querySelectorAll('.faq-item').forEach(function (el) {
          el.classList.remove('is-open');
          var t = el.querySelector('.faq-trigger');
          if (t) t.setAttribute('aria-expanded', 'false');
        });
        if (!wasOpen) {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  function initBillingToggle() {
    var monthlyBtn = document.getElementById('billing-monthly');
    var annualBtn = document.getElementById('billing-annual');
    if (!monthlyBtn || !annualBtn) return;
    var annual = false;

    function update() {
      monthlyBtn.classList.toggle('is-active', !annual);
      annualBtn.classList.toggle('is-active', annual);
      document.querySelectorAll('[data-price-monthly]').forEach(function (el) {
        el.textContent = annual
          ? el.getAttribute('data-price-annual')
          : el.getAttribute('data-price-monthly');
      });
      document.querySelectorAll('[data-sub-monthly]').forEach(function (el) {
        el.textContent = annual
          ? el.getAttribute('data-sub-annual')
          : el.getAttribute('data-sub-monthly');
      });
    }

    monthlyBtn.addEventListener('click', function () {
      annual = false;
      update();
    });
    annualBtn.addEventListener('click', function () {
      annual = true;
      update();
    });
  }

  function initYear() {
    var el = document.getElementById('year');
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function initSystemThemeListener() {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var handler = function () {
      if (getStoredTheme() === 'system') applyTheme('system');
    };
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else if (mq.addListener) mq.addListener(handler);
  }

  function preloadShots() {
    ['dashboard', 'inbox', 'orders', 'products', 'customers'].forEach(function (key) {
      ['light', 'dark'].forEach(function (mode) {
        var img = new Image();
        img.src = './screenshots/' + key + '-' + mode + '.png';
      });
    });
  }

  function boot() {
    applyTheme(getStoredTheme());
    initHeaderScroll();
    initMobileMenu();
    initSmoothAnchors();
    initFaq();
    initBillingToggle();
    initYear();
    initSystemThemeListener();
    preloadShots();

    var themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', cycleTheme);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
