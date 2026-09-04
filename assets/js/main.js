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

  /* `moveFocus` is opt-in, and is only ever passed from the submit handler.
     It must NOT be set from the blur handlers below: focusing the first
     invalid field from a blur handler yanks focus straight back into the
     field the user was trying to leave, so you cannot Tab (or click) out of
     a half-typed phone number — a keyboard trap, WCAG 2.1.2. */
  function validate(form, moveFocus) {
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

    if (moveFocus && first) first.focus();
    return ok;
  }

  /* Validates ONE field in isolation, for the blur handlers. Running the
     whole-form validate() on blur had a second bug beyond the focus trap:
     leaving Name empty and filling Phone correctly would flag Name, i.e.
     report an error about a field the user hadn't filled in yet. */
  function validateField(input) {
    if (input.name === 'name') {
      setError(input, input.value.trim().length < 2 ? 'Please enter your name.' : '');
    } else if (input.name === 'phone') {
      var digits = input.value.replace(/\D/g, '');
      setError(input, (digits.length < 10 || digits.length > 13)
        ? 'Please enter a valid phone number.' : '');
    }
  }

  if (form) {
    // Validate on blur, not on every keystroke
    ['name', 'phone'].forEach(function (n) {
      var input = form.elements[n];
      if (input) {
        input.addEventListener('blur', function () {
          if (input.value.trim()) validateField(input);
        });
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(form, true)) return;

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
      pawBurst(form.querySelector('button[type="submit"]'));
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
    closeCatalog();
    if (nav && nav.classList.contains('is-open')) setNav(false);
  });

  /* ---------- 14. Graceful fallback for images that fail to load ----------
     Named function (not an inline forEach) so §17's catalog modal can reuse
     the exact same logic for product photos it clones in *after* this
     one-time page-load pass — see the comment on bindBrokenImageFallback's
     call site in §17. */
  function bindBrokenImageFallback(img) {
    img.addEventListener('error', function () {
      var frame = img.closest('.ph');
      if (frame) frame.classList.add('is-broken');
    });
    // Catch images that already failed (or, same effect, have an empty/
    // missing src) before this ran
    if (img.complete && img.naturalWidth === 0) {
      var frame = img.closest('.ph');
      if (frame) frame.classList.add('is-broken');
    }
  }
  $$('.ph img').forEach(bindBrokenImageFallback);

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

  /* ---------- 16. Live pet photos — cursor tilt + paw-print trail ----------
     Every .ph photo frame (hero shots, category cards, gallery) tilts
     toward the cursor as it moves over it, like the pet is leaning in,
     and leaves a light trail of paw prints behind the pointer. Desktop
     with a real mouse only (checked via the hover/pointer media query —
     touch devices don't get a lingering cursor, so this would misfire
     there) and skipped completely under prefers-reduced-motion. rAF-
     throttled so fast mouse movement never spams layout work. */
  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var photoFrames = $$('.ph');
    var MAX_TILT     = 9;    // degrees
    var PAW_MIN_DIST = 46;   // px the cursor must travel before the next paw print
    var lastPaw       = null;
    var pendingMove    = null;
    var tiltRafQueued  = false;

    function spawnPaw(x, y) {
      var paw = document.createElement('span');
      paw.className = 'paw-trail';
      paw.innerHTML = '<svg class="ic"><use href="#i-paw"/></svg>';
      paw.style.left = x + 'px';
      paw.style.top  = y + 'px';
      paw.style.setProperty('--pt-rot', (Math.random() * 50 - 25).toFixed(1) + 'deg');
      document.body.appendChild(paw);
      paw.addEventListener('animationend', function () { paw.remove(); });
    }

    function applyPendingMove() {
      tiltRafQueued = false;
      if (!pendingMove) return;
      var frame = pendingMove.frame, x = pendingMove.x, y = pendingMove.y;
      var rect  = frame.getBoundingClientRect();
      var px    = (x - rect.left) / rect.width;
      var py    = (y - rect.top) / rect.height;

      frame.style.setProperty('--tiltX', ((px - 0.5) * MAX_TILT).toFixed(2) + 'deg');
      frame.style.setProperty('--tiltY', ((0.5 - py) * MAX_TILT).toFixed(2) + 'deg');
      frame.style.setProperty('--tiltZ', '1.04');
      frame.classList.add('is-live');

      if (!lastPaw || Math.hypot(x - lastPaw.x, y - lastPaw.y) >= PAW_MIN_DIST) {
        lastPaw = { x: x, y: y };
        spawnPaw(x, y);
      }
    }

    photoFrames.forEach(function (frame) {
      frame.addEventListener('mousemove', function (e) {
        pendingMove = { frame: frame, x: e.clientX, y: e.clientY };
        if (!tiltRafQueued) { tiltRafQueued = true; requestAnimationFrame(applyPendingMove); }
      });
      frame.addEventListener('mouseleave', function () {
        frame.style.setProperty('--tiltX', '0deg');
        frame.style.setProperty('--tiltY', '0deg');
        frame.style.setProperty('--tiltZ', '1');
        frame.classList.remove('is-live');
        lastPaw = null;
      });
    });
  }

  /* ---------- 17. Catalog modal ("View Catalog" per category) ----------
     Each of the 6 category cards carries a
     <template class="cat__catalog" data-catalog-for="cat-N"> holding that
     category's catalog items — real product cards (photo, name, optional
     price, in-stock badge, description; see CLAUDE.md §7) the owner
     manages from admin/. Clicking a [data-catalog-trigger]
     clones that category's template content into the shared #catModal.
     Title and lead text are read live off that category's .cat__title /
     .cat__body p (data-field="cat-N-title" / "cat-N-desc") rather than
     duplicated here, so an admin-panel edit to either one can never drift
     out of sync with what the modal shows. Open/close mechanics are a
     direct copy of the §8 lightbox: hidden attribute + .is-open class,
     body scroll lock, focus moved to the close button on open and back to
     the trigger on close, same 260ms close-transition delay before hiding. */
  var catModal       = $('#catModal');
  var catModalTitle  = $('#catModalTitle');
  var catModalDesc   = $('#catModalDesc');
  var catModalGrid   = $('#catModalGrid');
  var catModalWa     = $('#catModalWa');
  var catModalClose  = $('#catModalClose');
  var catModalOpener = null;

  function openCatalog(trigger) {
    if (!catModal) return;
    var key = trigger.getAttribute('data-catalog-trigger');
    if (!key) return;

    var titleEl = $('[data-field="' + key + '-title"]');
    var descEl  = $('[data-field="' + key + '-desc"]');
    var tpl     = $('template[data-catalog-for="' + key + '"]');
    if (!tpl) return;

    var catName = titleEl ? titleEl.textContent.trim() : '';

    catModalOpener = trigger;
    if (catModalTitle) catModalTitle.textContent = catName;
    if (catModalDesc)  catModalDesc.textContent = descEl ? descEl.textContent.trim() : '';

    if (catModalGrid) {
      while (catModalGrid.firstChild) catModalGrid.removeChild(catModalGrid.firstChild);
      catModalGrid.appendChild(tpl.content.cloneNode(true));

      // Product photos are cloned in here, after §14's one-time page-load
      // forEach already ran — rebind the same broken/empty-image fallback
      // so a product with no photo yet (or a bad admin-entered URL) still
      // gets the site's usual gradient+paw placeholder instead of a raw
      // broken-image icon. Cursor-tilt (§16) is deliberately NOT rebound
      // here — see the CSS "CATALOG MODAL" comment block for why that's a
      // fine, low-risk choice for this small product-grid popup.
      $$('.ph img', catModalGrid).forEach(bindBrokenImageFallback);
    }

    if (catModalWa) {
      var text = "Hi! I'm interested in your " + catName + ' — what do you currently have available?';
      catModalWa.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);
    }

    catModal.hidden = false;
    requestAnimationFrame(function () { catModal.classList.add('is-open'); });
    document.body.style.overflow = 'hidden';
    if (catModalClose) catModalClose.focus();
  }

  function closeCatalog() {
    if (!catModal || catModal.hidden) return;
    catModal.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function () {
      catModal.hidden = true;
      if (catModalOpener) catModalOpener.focus();
    }, 260);
  }

  $$('[data-catalog-trigger]').forEach(function (btn) {
    btn.addEventListener('click', function () { openCatalog(btn); });
  });
  if (catModalClose) catModalClose.addEventListener('click', closeCatalog);
  if (catModal) {
    catModal.addEventListener('click', function (e) {
      if (e.target === catModal) closeCatalog();
    });
  }

  /* ---------- 18. Category favourites (heart toggle, localStorage) ----------
     Per-visitor convenience only — not admin-editable, doesn't sync
     anywhere, doesn't touch any data-field content. Persists as a plain
     array of category keys ("cat-1".."cat-6") under one clearly-
     namespaced localStorage key so it can never collide with anything
     else this origin might ever store. All storage access is wrapped in
     try/catch: getItem/setItem can both throw in private-browsing or
     storage-blocked contexts, and a storage failure must never break
     the page — favourites simply won't persist that session. */
  var FAV_KEY = 'vspetshop:favorites';

  function readFavorites() {
    try {
      var raw = window.localStorage.getItem(FAV_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function writeFavorites(arr) {
    try {
      window.localStorage.setItem(FAV_KEY, JSON.stringify(arr));
    } catch (e) {
      // storage blocked/full/private mode — fail silently
    }
  }

  var favButtons = $$('[data-fav]');
  if (favButtons.length) {
    var favorites = readFavorites();

    // Reads the category's live title text (same "read it off the DOM,
    // don't duplicate it" approach §17's catalog modal uses for cat-N
    // title/desc) so the aria-label always matches whatever the owner
    // has renamed the category to in admin, without this module needing
    // to know about data-field at all.
    function favLabel(btn, isFav) {
      var card = btn.closest('.cat');
      var titleEl = card ? $('.cat__title', card) : null;
      var name = titleEl ? titleEl.textContent.trim() : 'this category';
      return (isFav ? 'Remove ' : 'Add ') + name + (isFav ? ' from favourites' : ' to favourites');
    }

    function applyFavState(btn, isFav) {
      btn.setAttribute('aria-pressed', String(isFav));
      btn.setAttribute('aria-label', favLabel(btn, isFav));
    }

    favButtons.forEach(function (btn) {
      var key = btn.getAttribute('data-fav');
      applyFavState(btn, favorites.indexOf(key) !== -1);

      btn.addEventListener('click', function () {
        var idx     = favorites.indexOf(key);
        var nowFav  = idx === -1;
        if (nowFav) favorites.push(key);
        else favorites.splice(idx, 1);
        writeFavorites(favorites);
        applyFavState(btn, nowFav);

        if (!reduceMotion) {
          btn.classList.remove('is-pop');
          void btn.offsetWidth; // restart the animation on rapid re-clicks
          btn.classList.add('is-pop');
        }
      });

      btn.addEventListener('animationend', function () {
        btn.classList.remove('is-pop');
      });
    });
  }

  /* ---------- 19. Paw-burst on successful WhatsApp submit ----------
     Called from §10 right after the WhatsApp deep link opens. Spawns a
     short burst of paw icons popping outward from the submit button —
     the same one-shot spawn/animate/remove-on-animationend idiom as the
     §16 .paw-trail cursor trail, just radiating from a point instead of
     following the mouse. Skipped entirely under reduced motion (the
     existing #formNote text is enough on its own then). Purely a visual
     add-on: never touches form.reset() or the validation/submit logic. */
  function pawBurst(originEl) {
    if (reduceMotion || !originEl) return;
    var rect  = originEl.getBoundingClientRect();
    var cx    = rect.left + rect.width / 2;
    var cy    = rect.top + rect.height / 2;
    var count = 6 + Math.round(Math.random() * 2); // 6-8 paws

    for (var i = 0; i < count; i++) {
      (function (i) {
        var angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2);
        var dist  = 60 + Math.random() * 40;
        var paw   = document.createElement('span');
        paw.className = 'paw-burst';
        paw.innerHTML  = '<svg class="ic"><use href="#i-paw"/></svg>';
        paw.style.left = cx + 'px';
        paw.style.top  = cy + 'px';
        paw.style.setProperty('--pb-x', (Math.cos(angle) * dist).toFixed(1) + 'px');
        paw.style.setProperty('--pb-y', (Math.sin(angle) * dist).toFixed(1) + 'px');
        paw.style.setProperty('--pb-rot', (Math.random() * 60 - 30).toFixed(1) + 'deg');
        paw.style.setProperty('--pb-dur', (600 + Math.random() * 300).toFixed(0) + 'ms');
        document.body.appendChild(paw);
        paw.addEventListener('animationend', function () { paw.remove(); });
      })(i);
    }
  }

  /* ---------- 20. Pet care tip strip — gentle auto-rotation ----------
     Rotates through a handful of generic, well-known pet-care facts —
     not claims about this shop (CLAUDE.md §6 is about the latter; this
     is a different, safe category of content). Crossfades using the
     .is-fading opacity transition already defined on .tip-strip__text,
     on a 5.5s timer, paused on hover/focus so nobody reading it loses
     their place. Under prefers-reduced-motion no interval is ever
     started — the first tip just shows, statically, permanently. */
  var tipTextEl = $('#tipStripText');
  var tipCardEl = $('#tipStrip');
  if (tipTextEl && tipCardEl) {
    var TIPS = [
      "A dog's sense of smell is tens of thousands of times stronger than a human's.",
      'Cats spend around 70% of their life asleep.',
      'Puppies are usually ready for their first vaccinations around 6-8 weeks old.',
      "A rabbit's teeth never stop growing, which is why they need things to gnaw on.",
      'Regular nail trims help keep a dog’s paws healthy and its gait comfortable.',
      'Fresh water should be available for pets at all times, not just at mealtimes.'
    ];
    var tipIndex = 0;
    var tipTimer = null;

    function showTip(i) {
      tipTextEl.textContent = TIPS[i];
    }

    function nextTip() {
      tipTextEl.classList.add('is-fading');
      setTimeout(function () {
        tipIndex = (tipIndex + 1) % TIPS.length;
        showTip(tipIndex);
        tipTextEl.classList.remove('is-fading');
      }, 220);
    }

    function startTips() {
      if (tipTimer || reduceMotion) return;
      tipTimer = setInterval(nextTip, 5500);
    }
    function stopTips() {
      if (!tipTimer) return;
      clearInterval(tipTimer);
      tipTimer = null;
    }

    showTip(0);
    if (!reduceMotion) {
      startTips();
      tipCardEl.addEventListener('mouseenter', stopTips);
      tipCardEl.addEventListener('mouseleave', startTips);
      tipCardEl.addEventListener('focusin', stopTips);
      tipCardEl.addEventListener('focusout', startTips);
    }
  }

})();
