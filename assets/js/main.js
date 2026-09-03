/* =========================================================
   VS PET SHOP — main.js
   Vanilla JS. No dependencies, no build step.
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     CONFIG — change these two values and the whole site follows
     --------------------------------------------------------- */
  var WHATSAPP_NUMBER = '918851203070';   // country code + number, digits only
  var SHOP_NAME       = 'VS Pet Shop';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- 1. Footer year ---------- */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 2. Sticky header shadow ---------- */
  var header = $('#header');
  var onScrollHeader = function () {
    if (header) header.classList.toggle('is-stuck', window.scrollY > 12);
  };
  onScrollHeader();

  /* ---------- 3. Mobile navigation drawer ---------- */
  var nav      = $('#nav');
  var navOpen  = $('#navToggle');
  var navClose = $('#navClose');
  var navScrim = $('#navScrim');

  function setNav(open) {
    if (!nav) return;
    nav.classList.toggle('is-open', open);
    if (navOpen) navOpen.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';

    if (navScrim) {
      if (open) {
        navScrim.hidden = false;
        requestAnimationFrame(function () { navScrim.classList.add('is-open'); });
      } else {
        navScrim.classList.remove('is-open');
        setTimeout(function () { navScrim.hidden = true; }, 260);
      }
    }
    if (open && navClose) navClose.focus();
    else if (!open && navOpen) navOpen.focus();
  }

  if (navOpen)  navOpen.addEventListener('click', function () { setNav(true); });
  if (navClose) navClose.addEventListener('click', function () { setNav(false); });
  if (navScrim) navScrim.addEventListener('click', function () { setNav(false); });

  $$('.nav__link, .nav__cta').forEach(function (link) {
    link.addEventListener('click', function () { setNav(false); });
  });

  /* ---------- 4. Active nav link on scroll ---------- */
  var navLinks = $$('.nav__link');
  var sections = navLinks
    .map(function (l) { return document.querySelector(l.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (l) {
          l.classList.toggle('is-active', l.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (s) { navObserver.observe(s); });
  }

  /* ---------- 5. Scroll reveal + stagger ---------- */
  var revealEls = $$('.reveal, [data-stagger]');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('is-in');

        // Stagger children by 70ms each (matches the 21st.dev stagger pattern)
        if (el.hasAttribute('data-stagger')) {
          Array.prototype.forEach.call(el.children, function (child, i) {
            child.style.transitionDelay = (i * 70) + 'ms';
          });
        }
        obs.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- 6. Animated stat counters ---------- */
  function runCounter(el) {
    var target   = parseFloat(el.getAttribute('data-count')) || 0;
    var decimals = parseInt(el.getAttribute('data-decimals'), 10) || 0;
    var suffix   = el.getAttribute('data-suffix') || '';
    var duration = 1500;
    var start    = null;

    if (reduceMotion) {
      el.textContent = target.toLocaleString('en-IN', {
        minimumFractionDigits: decimals, maximumFractionDigits: decimals
      }) + suffix;
      return;
    }

    function step(now) {
      if (start === null) start = now;
      var p    = Math.min((now - start) / duration, 1);
      var ease = 1 - Math.pow(1 - p, 3);           // easeOutCubic
      var val  = target * ease;

      el.textContent = val.toLocaleString('en-IN', {
        minimumFractionDigits: decimals, maximumFractionDigits: decimals
      }) + suffix;

      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var counters = $$('.stat__num');
  if ('IntersectionObserver' in window && counters.length) {
    var countObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { countObserver.observe(c); });
  } else {
    counters.forEach(runCounter);
  }

  /* ---------- 7. Infinite marquees (reviews + ribbon) ---------- */
  function initMarquee(track) {
    var set = track.firstElementChild;
    if (!set) return;

    // Duplicate the set so the -50% translate loops seamlessly
    track.appendChild(set.cloneNode(true));

    var width = set.getBoundingClientRect().width;
    var speed = Math.max(18, Math.round(width / 55));   // ~55px per second
    track.style.setProperty('--speed', speed + 's');

    if (!reduceMotion) track.classList.add('is-running');
  }
  $$('[data-marquee]').forEach(initMarquee);

  /* ---------- 8. Gallery lightbox ---------- */
  var lb       = $('#lightbox');
  var lbImg    = $('#lbImg');
  var lbCap    = $('#lbCap');
  var lbClose  = $('#lbClose');
  var lbOpener = null;

  function openLightbox(btn) {
    if (!lb) return;
    lbOpener = btn;
    lbImg.src = btn.getAttribute('data-src');
    lbImg.alt = btn.getAttribute('data-caption') || '';
    lbCap.textContent = btn.getAttribute('data-caption') || '';

    lb.hidden = false;
    requestAnimationFrame(function () { lb.classList.add('is-open'); });
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }

  function closeLightbox() {
    if (!lb || lb.hidden) return;
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function () {
      lb.hidden = true;
      lbImg.src = '';
      if (lbOpener) lbOpener.focus();
    }, 260);
  }

  $$('[data-lightbox]').forEach(function (btn) {
    btn.addEventListener('click', function () { openLightbox(btn); });
  });
  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lb) {
    lb.addEventListener('click', function (e) {
      if (e.target === lb) closeLightbox();
    });
  }

  /* ---------- 9. FAQ — one open at a time ---------- */
  var faqItems = $$('.faq__item');
  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) return;
      faqItems.forEach(function (other) {
        if (other !== item) other.open = false;
      });
    });
  });

  /* ---------- 10. Enquiry form -> WhatsApp ---------- */
  var form = $('#enquiryForm');

  function setError(input, message) {
    var field = input.closest('.field');
    var slot  = field ? field.querySelector('[data-err]') : null;
    if (field) field.classList.toggle('has-error', Boolean(message));
    if (slot)  slot.textContent = message || '';
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function validate(form) {
    var name  = form.elements.name;
    var phone = form.elements.phone;
    var ok    = true;
    var first = null;

    if (name.value.trim().length < 2) {
      setError(name, 'Please enter your name.');
      ok = false; first = first || name;
    } else {
      setError(name, '');
    }

    var digits = phone.value.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 13) {
      setError(phone, 'Please enter a valid phone number.');
      ok = false; first = first || phone;
    } else {
      setError(phone, '');
    }

    if (first) first.focus();
    return ok;
  }

  if (form) {
    // Validate on blur, not on every keystroke
    ['name', 'phone'].forEach(function (n) {
      var input = form.elements[n];
      if (input) {
        input.addEventListener('blur', function () {
          if (input.value.trim()) validate(form);
        });
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(form)) return;

      var name  = form.elements.name.value.trim();
      var phone = form.elements.phone.value.trim();
      var topic = form.elements.topic.value;
      var msg   = form.elements.message.value.trim();

      var text =
        'Hello ' + SHOP_NAME + '!\n\n' +
        'Name: ' + name + '\n' +
        'Phone: ' + phone + '\n' +
        'Interested in: ' + topic +
        (msg ? '\n\nMessage: ' + msg : '');

      var waUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);
      var win   = window.open(waUrl, '_blank', 'noopener');

      // If a popup blocker swallowed the new tab, navigate this one instead
      if (!win || win.closed || typeof win.closed === 'undefined') {
        window.location.href = waUrl;
        return;
      }

      var note = $('#formNote');
      if (note) {
        note.textContent = 'Opening WhatsApp with your message — just hit send.';
        setTimeout(function () { note.textContent = ''; }, 6000);
      }
      form.reset();
    });
  }

  /* ---------- 11. Back to top ---------- */
  var toTop = $('#toTop');
  var onScrollTop = function () {
    if (toTop) toTop.hidden = window.scrollY < 600;
  };
  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    onScrollTop();
  }

  /* ---------- 12. Single throttled scroll listener ---------- */
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      onScrollHeader();
      onScrollTop();
      ticking = false;
    });
  }, { passive: true });

  /* ---------- 13. Escape key closes overlays ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeLightbox();
    if (nav && nav.classList.contains('is-open')) setNav(false);
  });

  /* ---------- 14. Graceful fallback for images that fail to load ---------- */
  $$('.ph img').forEach(function (img) {
    img.addEventListener('error', function () {
      var frame = img.closest('.ph');
      if (frame) frame.classList.add('is-broken');
    });
    // Catch images that already failed before this script ran
    if (img.complete && img.naturalWidth === 0) {
      var frame = img.closest('.ph');
      if (frame) frame.classList.add('is-broken');
    }
  });

  /* ---------- 15. Re-measure marquees after resize ---------- */
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      $$('[data-marquee]').forEach(function (track) {
        var set = track.firstElementChild;
        if (!set) return;
        var width = set.getBoundingClientRect().width;
        track.style.setProperty('--speed', Math.max(18, Math.round(width / 55)) + 's');
      });
    }, 250);
  }, { passive: true });

})();
