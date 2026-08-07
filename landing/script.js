/**
 * DokaanDM static landing — theme, nav, FAQ, pricing, screenshot theme switch,
 * scroll reveals, interactive product tabs, DM simulator, ROI calculator, lightbox, scroll spy
 */
(function () {
  'use strict';

  var THEME_KEY = 'dokaandm-landing-theme';

  /**
   * `el.hidden = true` only reflects to an attribute on HTMLElement — on an
   * <svg> it sets a dead expando, so the CSS [hidden] rule never matches.
   * Always toggle the attribute directly for icon swaps.
   */
  function setHidden(el, hidden) {
    if (!el) return;
    if (hidden) el.setAttribute('hidden', '');
    else el.removeAttribute('hidden');
  }

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

    setHidden(document.querySelector('.icon-sun'), !isDark);
    setHidden(document.querySelector('.icon-moon'), isDark);

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

    // Also update open lightbox image if visible
    var lightbox = document.getElementById('lightbox');
    if (lightbox && lightbox.classList.contains('is-open')) {
      var activeShotKey = lightbox.getAttribute('data-active-shot');
      if (activeShotKey) {
        var img = document.getElementById('lightbox-img');
        if (img) img.src = './screenshots/' + activeShotKey + '-' + (isDark ? 'dark' : 'light') + '.png';
      }
    }
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
      setHidden(menuIcon, open);
      setHidden(closeIcon, !open);
      document.body.style.overflow = open ? 'hidden' : '';
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

    // A resize past the desktop breakpoint must not leave the scroll lock on.
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 900 && isOpen()) setOpen(false);
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

  /* Scroll Reveal Observer */
  function initScrollReveal() {
    var reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    if (!('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    reveals.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* Screenshot Lightbox Modal */
  function initLightbox() {
    var lightbox = document.getElementById('lightbox');
    var overlay = document.getElementById('lightbox-overlay');
    var closeBtn = document.getElementById('lightbox-close');
    var imgEl = document.getElementById('lightbox-img');
    var titleEl = document.getElementById('lightbox-title');
    if (!lightbox || !imgEl) return;
    var lastFocused = null;

    var shotTitles = {
      dashboard: 'Dashboard Workspace — Revenue, Orders & COD Queue',
      inbox: 'Unified Inbox — Facebook Messenger & Instagram Direct',
      orders: 'Order Kanban Pipeline — Drag & Drop Status Stages',
      customers: 'Customer CRM — Identity, Total Spent & COD History',
      products: 'Product Catalog — Line Items & Inventory Snapshot'
    };

    function openLightbox(shotKey) {
      var isDark = document.documentElement.classList.contains('dark');
      var title = shotTitles[shotKey] || 'DokaanDM Preview';
      lastFocused = document.activeElement;
      imgEl.src = './screenshots/' + shotKey + '-' + (isDark ? 'dark' : 'light') + '.png';
      if (titleEl) titleEl.textContent = title;
      lightbox.setAttribute('data-active-shot', shotKey);
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      if (closeBtn) closeBtn.focus();
    }

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    document.querySelectorAll('.shot-clickable').forEach(function (el) {
      // Screenshots are zoomable, so they need to behave like controls.
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', 'Open full-size screenshot');
      el.addEventListener('click', function () {
        var key = el.getAttribute('data-shot');
        if (key) openLightbox(key);
      });
      el.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        var key = el.getAttribute('data-shot');
        if (key) openLightbox(key);
      });
    });

    if (overlay) overlay.addEventListener('click', closeLightbox);
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lightbox.classList.contains('is-open')) {
        closeLightbox();
      }
    });
  }

  /* Product tour — one active panel, scroll-linked tabs (no stacked ghosts) */
  function initProductTabs() {
    var pin = document.getElementById('product-pin');
    var tabList = document.querySelector('.product-quick-nav');
    if (!pin || !tabList) return;

    var tabs = Array.prototype.slice.call(tabList.querySelectorAll('.quick-tab'));
    var panels = Array.prototype.slice.call(pin.querySelectorAll('.product-block'));
    var n = Math.min(tabs.length, panels.length);
    if (!n) return;

    // Keep pin height in sync with actual tab count only
    pin.style.setProperty('--product-steps', String(n));

    var activeIndex = -1;
    var lockFromClick = false;
    var lockTimer = null;
    var ticking = false;
    var reduceMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Mirrors the CSS breakpoint in styles.css: below 1024px the panel stacks
    // taller than the viewport, so the tour runs as plain click-driven tabs
    // instead of a scroll-pinned sequence.
    var pinQuery = window.matchMedia('(min-width: 1024px)');

    function isPinned() {
      return pinQuery.matches && !reduceMotion;
    }

    function headerHeight() {
      var header = document.getElementById('site-header');
      return header ? header.offsetHeight : 64;
    }

    function clamp(v, min, max) {
      return Math.max(min, Math.min(max, v));
    }

    function scrollRange() {
      var stickyTop = headerHeight();
      var pinTop = pin.getBoundingClientRect().top + window.scrollY;
      var start = pinTop - stickyTop;
      var end = pinTop + pin.offsetHeight - window.innerHeight;
      if (end < start) end = start;
      return { start: start, end: end };
    }

    function scrollMetrics() {
      var range = scrollRange();
      var span = range.end - range.start;
      var progress = span <= 0 ? 0 : (window.scrollY - range.start) / span;
      progress = clamp(progress, 0, 1);

      // Map progress cleanly across n segments without wrapping past the last
      var scaled = progress * n;
      var index = Math.min(n - 1, Math.floor(scaled));
      var segment = scaled - index;
      if (progress >= 1) {
        index = n - 1;
        segment = 1;
      }
      segment = clamp(segment, 0, 1);

      return { progress: progress, index: index, segment: segment, range: range, span: span };
    }

    function clearInlinePanelStyles(panel) {
      if (!panel) return;
      panel.style.opacity = '';
      panel.style.visibility = '';
      panel.style.transform = '';
      panel.style.zIndex = '';
      panel.style.pointerEvents = '';
      var copy = panel.querySelector('.product-copy');
      var shot = panel.querySelector('.shot-stage');
      if (copy) {
        copy.style.opacity = '';
        copy.style.transform = '';
      }
      if (shot) {
        shot.style.opacity = '';
        shot.style.transform = '';
      }
      panel.querySelectorAll('.product-bullets li').forEach(function (li) {
        li.style.opacity = '';
        li.style.transform = '';
      });
    }

    function setActive(index, segment) {
      index = clamp(index, 0, n - 1);
      segment = typeof segment === 'number' ? clamp(segment, 0, 1) : 0;

      pin.style.setProperty('--product-segment', segment.toFixed(4));
      pin.style.setProperty('--product-progress', ((index + segment) / n).toFixed(4));

      // Tabs: progress fill + single active — never cycles past n
      var pinned = isPinned();
      tabs.forEach(function (tab, i) {
        if (i >= n) {
          tab.hidden = true;
          return;
        }
        var fill = tab.querySelector('.quick-tab-fill');
        var scale = 0;
        if (!pinned) {
          // Tab mode: the bar marks the selected tab, not scroll progress.
          scale = i === index ? 1 : 0;
        } else if (i < index) scale = 1;
        else if (i === index) scale = Math.max(0.06, segment);
        else scale = 0;

        if (fill) fill.style.transform = 'scaleX(' + scale + ')';

        var on = i === index;
        tab.classList.toggle('is-active', on);
        tab.classList.toggle('is-done', i < index);
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.tabIndex = on ? 0 : -1;
      });

      // Panels: exactly one is-active (display:none on others — no stacked ghosts)
      if (index !== activeIndex) {
        panels.forEach(function (panel, i) {
          clearInlinePanelStyles(panel);
          panel.classList.remove('is-active', 'is-entering', 'is-leaving');
          if (i === index) {
            panel.classList.add('is-active');
            panel.setAttribute('aria-hidden', 'false');
          } else {
            panel.setAttribute('aria-hidden', 'true');
          }
        });
        activeIndex = index;
      }
    }

    function scrollToIndex(index, behavior) {
      var range = scrollRange();
      var span = range.end - range.start;
      var target = range.start + ((clamp(index, 0, n - 1) + 0.08) / n) * span;
      window.scrollTo({ top: target, behavior: behavior || 'smooth' });
    }

    function onScroll() {
      if (!isPinned() || ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var metrics = scrollMetrics();

        // Outside the pin: snap to ends so state doesn't get stuck mid-cycle
        if (window.scrollY < metrics.range.start - 40) {
          if (!lockFromClick) setActive(0, 0);
          return;
        }
        if (window.scrollY > metrics.range.end + 40) {
          if (!lockFromClick) setActive(n - 1, 1);
          return;
        }

        setActive(metrics.index, metrics.segment);
      });
    }

    tabs.forEach(function (btn, i) {
      if (i >= n) return;
      btn.addEventListener('click', function () {
        var index = parseInt(btn.getAttribute('data-index'), 10);
        if (isNaN(index)) index = i;
        index = clamp(index, 0, n - 1);

        if (!isPinned()) {
          // Tab mode: swap the panel in place, no scroll hijacking.
          setActive(index, 1);
          return;
        }

        setActive(index, 0.08);

        lockFromClick = true;
        if (lockTimer) clearTimeout(lockTimer);
        scrollToIndex(index, 'smooth');
        lockTimer = setTimeout(function () {
          lockFromClick = false;
          var metrics = scrollMetrics();
          setActive(metrics.index, metrics.segment);
        }, 700);
      });
    });

    tabList.addEventListener('keydown', function (e) {
      var dir = 0;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') dir = 1;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') dir = -1;
      if (!dir) return;
      e.preventDefault();
      var next = clamp(activeIndex + dir, 0, n - 1);
      if (next === activeIndex) return;
      tabs[next].click();
      tabs[next].focus();
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // Crossing the breakpoint swaps pinned <-> tab mode; re-sync so the fills
    // and the active panel match the mode we just entered.
    function onModeChange() {
      lockFromClick = false;
      if (lockTimer) clearTimeout(lockTimer);
      if (isPinned()) {
        var metrics = scrollMetrics();
        setActive(metrics.index, metrics.segment);
      } else {
        setActive(activeIndex < 0 ? 0 : activeIndex, 1);
      }
    }

    if (pinQuery.addEventListener) pinQuery.addEventListener('change', onModeChange);
    else if (pinQuery.addListener) pinQuery.addListener(onModeChange);

    // Initial state: first panel only
    panels.forEach(function (panel, i) {
      clearInlinePanelStyles(panel);
      panel.classList.remove('is-entering', 'is-leaving');
      if (i === 0) {
        panel.classList.add('is-active');
        panel.setAttribute('aria-hidden', 'false');
      } else {
        panel.classList.remove('is-active');
        panel.setAttribute('aria-hidden', 'true');
      }
    });
    activeIndex = 0;
    setActive(0, 0);
    onScroll();
  }

  /* DM Order Capture Simulator */
  function initDmSimulator() {
    var btn = document.getElementById('sim-capture-btn');
    var card = document.getElementById('sim-result-card');
    var badge = document.getElementById('sim-cod-badge');
    if (!btn || !card) return;

    var isCapturing = false;
    var demoStates = [
      {
        no: '#DKN-1048',
        name: 'Pooja Sharma (9841234567)',
        addr: 'New Baneshwor, Kathmandu',
        item: 'Black Oversized Hoodie (Size M)',
        total: 'NPR 2,490',
        codText: 'Low COD risk · 0 returns on record',
        codClass: 'badge-success'
      },
      {
        no: '#DKN-1049',
        name: 'Rohan Shrestha (9818987654)',
        addr: 'Lalitpur, Ward 4',
        item: 'Vintage Denim Jacket (Size L)',
        total: 'NPR 3,850',
        codText: 'Medium COD risk · 1 return on record',
        codClass: 'badge-pending'
      }
    ];
    var stateIdx = 0;

    btn.addEventListener('click', function () {
      if (isCapturing) return;
      isCapturing = true;

      btn.disabled = true;
      btn.style.opacity = '0.7';
      btn.innerHTML = '<svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Capturing…';

      card.style.transform = 'scale(0.98)';
      card.style.opacity = '0.5';

      setTimeout(function () {
        stateIdx = (stateIdx + 1) % demoStates.length;
        var st = demoStates[stateIdx];

        document.querySelector('.order-no').textContent = st.no;
        document.getElementById('sim-cust-name').textContent = st.name;
        document.getElementById('sim-cust-addr').textContent = st.addr;
        document.getElementById('sim-cust-item').textContent = st.item;
        document.getElementById('sim-cust-total').textContent = st.total;

        if (badge) {
          badge.className = 'sim-cod-badge ' + st.codClass;
          badge.querySelector('span').textContent = st.codText;
        }

        card.style.transform = 'scale(1)';
        card.style.opacity = '1';

        btn.disabled = false;
        btn.style.opacity = '1';
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M20 6L9 17l-5-5"/></svg> Order captured';

        setTimeout(function () {
          btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M6 2h12l3 7H3l3-7z"/><path d="M3 9v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9"/><path d="M10 14h4"/></svg> Try the next message';
          isCapturing = false;
        }, 1800);
      }, 500);
    });
  }

  /* Interactive COD Risk & ROI Calculator */
  function initRoiCalculator() {
    var ordersInput = document.getElementById('calc-orders');
    var aovInput = document.getElementById('calc-aov');
    var returnRateInput = document.getElementById('calc-return-rate');

    var ordersVal = document.getElementById('calc-orders-val');
    var aovVal = document.getElementById('calc-aov-val');
    var returnVal = document.getElementById('calc-return-val');

    var totalSavingsEl = document.getElementById('calc-savings-total');
    var preventedOrdersEl = document.getElementById('calc-prevented-orders');
    var shippingCostEl = document.getElementById('calc-shipping-cost');

    var gmvEl = document.getElementById('calc-gmv');
    var returnsEl = document.getElementById('calc-returns');
    var flaggedEl = document.getElementById('calc-flagged');

    if (!ordersInput || !aovInput || !returnRateInput) return;

    function formatNpr(amount) {
      return 'NPR ' + Math.round(amount).toLocaleString('en-US');
    }

    // Paints the filled portion of the track (see .calc-slider --pct in styles.css)
    function paintTrack(input) {
      var min = parseFloat(input.min) || 0;
      var max = parseFloat(input.max) || 100;
      var val = parseFloat(input.value);
      var pct = max === min ? 0 : ((val - min) / (max - min)) * 100;
      input.style.setProperty('--pct', pct.toFixed(2) + '%');
    }

    function calculate() {
      [ordersInput, aovInput, returnRateInput].forEach(paintTrack);

      var orders = parseInt(ordersInput.value, 10) || 150;
      var aov = parseInt(aovInput.value, 10) || 1800;
      var returnRate = parseInt(returnRateInput.value, 10) || 12;

      if (ordersVal) ordersVal.textContent = orders + ' orders';
      if (aovVal) aovVal.textContent = formatNpr(aov);
      if (returnVal) returnVal.textContent = returnRate + '%';

      // ~75% of potential return orders flagged before dispatch.
      // Savings = (prevented * AOV * 0.20) + (prevented * NPR 180 shipping)
      var totalReturns = Math.round((orders * returnRate) / 100);
      var preventedReturns = Math.max(1, Math.round(totalReturns * 0.75));
      var wastedShippingSaved = preventedReturns * 180;
      var totalRevenueProtected = Math.round((preventedReturns * aov * 0.20) + wastedShippingSaved);

      if (totalSavingsEl) totalSavingsEl.textContent = formatNpr(totalRevenueProtected);
      if (preventedOrdersEl) preventedOrdersEl.textContent = String(preventedReturns);
      if (shippingCostEl) shippingCostEl.textContent = Math.round(wastedShippingSaved).toLocaleString('en-US');

      if (gmvEl) gmvEl.textContent = formatNpr(orders * aov);
      if (returnsEl) returnsEl.textContent = totalReturns + (totalReturns === 1 ? ' order' : ' orders');
      if (flaggedEl) {
        flaggedEl.textContent = preventedReturns + (preventedReturns === 1 ? ' order' : ' orders');
      }
    }

    ordersInput.addEventListener('input', calculate);
    aovInput.addEventListener('input', calculate);
    returnRateInput.addEventListener('input', calculate);
    calculate();
  }

  /* Active Scroll Spy Nav Indicator */
  function initScrollSpy() {
    var sections = document.querySelectorAll('section[id]');
    var navLinks = document.querySelectorAll('.nav-desktop a[href^="#"]');
    if (!sections.length || !navLinks.length) return;

    var ticking = false;

    function update() {
      var scrollPos = window.scrollY + 96;
      var current = null;

      sections.forEach(function (sec) {
        var top = sec.getBoundingClientRect().top + window.scrollY;
        if (scrollPos >= top && scrollPos < top + sec.offsetHeight) {
          current = sec.getAttribute('id');
        }
      });

      navLinks.forEach(function (link) {
        link.classList.toggle('is-active', !!current && link.getAttribute('href') === '#' + current);
      });
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        update();
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    update();
  }

  /* Back to Top Floating Button */
  function initBackToTop() {
    var btn = document.getElementById('back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', function () {
      btn.hidden = window.scrollY < 400;
    }, { passive: true });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    initScrollReveal();
    initLightbox();
    initProductTabs();
    initDmSimulator();
    initRoiCalculator();
    initScrollSpy();
    initBackToTop();
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
