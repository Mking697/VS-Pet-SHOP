/* =========================================================
   VS PET SHOP — analytics & ads conversion tracking
   Vanilla JS. No dependencies, no build step. Loaded `defer`.

   ── SET THE IDs FROM THE ADMIN PANEL, NOT IN THIS FILE. ──
   admin/ → "Analytics & Ads" section. They are stored as data-attributes on
   this script's tag in index.html; see the CONFIG block below for why.

   While every ID is blank this file does NOTHING: no script is injected, no
   network request is made, no cookie is set. That is deliberate, so the
   tracking plumbing could ship before the accounts existed without costing the
   site a single byte. Fill an ID in and that platform switches on by itself on
   the next page load.

   WHERE TO GET EACH ID (the admin panel repeats this next to each field)
   ---------------------------------------------------------------------
   GA4_ID              analytics.google.com → Admin → Data streams → your web
                       stream → "Measurement ID". Looks like G-XXXXXXXXXX.

   GOOGLE_ADS_ID       ads.google.com → Tools → Conversions → create a
                       conversion action → Tag setup. Looks like AW-123456789.

   ADS_LABELS          On each conversion action's tag-setup screen Google
                       shows `'send_to': 'AW-123456789/AbCdEfGhIj'`. The part
                       AFTER the slash is the label. Create one conversion
                       action per row below and paste its label in.
                       Leave a label blank and that one event simply isn't
                       reported to Google Ads (it still goes to GA4).

   META_PIXEL_ID       business.facebook.com → Events Manager → Data sources →
                       your pixel → the numeric ID at the top.

   A NOTE ON WHAT IS AND ISN'T POSSIBLE HERE
   -----------------------------------------
   This site has no backend (CLAUDE.md §1). So:
   - Meta's Conversions API (server-side, the thing that recovers conversions
     lost to iOS/ad-blockers) CANNOT be implemented here. Browser pixel only.
     Expect Meta to under-report; that is a platform reality, not a bug.
   - Enhanced Conversions for Google Ads (hashed email/phone) are not wired up
     either — the enquiry form never posts the data anywhere, it just opens a
     WhatsApp deep link, so there is no post-conversion page to read it on.

   WHAT COUNTS AS A CONVERSION ON THIS SITE
   ----------------------------------------
   There is no cart and no checkout. The only real actions a visitor can take
   are: phone the shop, message it on WhatsApp, or ask for directions. Those
   are what this file tracks. Do not add "page view" as an Ads conversion —
   it will make every campaign look successful while telling you nothing.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- CONFIG ----------
     The IDs are NOT stored in this file. They live as data-attributes on this
     script's own <script> tag in index.html, so the shop owner can set them
     from the admin panel (Analytics & Ads section) without touching code and
     without having to upload this file at all — index.html is the only file
     they already download and re-upload.

     Tracking IDs are not secrets: a GA4 measurement ID or a Meta pixel ID is
     visible in the page source of every site that uses one. Nothing is being
     exposed here that isn't public on any site running these tags.

     `document.currentScript` is the script being executed; the querySelector
     is a fallback for the rare case it's unavailable (some older browsers on
     deferred scripts). --------------------------------------------------- */
  var tag = document.currentScript ||
            document.querySelector('script[src*="analytics.js"]');
  if (!tag) return;

  var cfg = function (name) { return (tag.getAttribute(name) || '').trim(); };

  var GA4_ID        = cfg('data-ga4');          // e.g. 'G-XXXXXXXXXX'
  var GOOGLE_ADS_ID = cfg('data-google-ads');   // e.g. 'AW-123456789'
  var META_PIXEL_ID = cfg('data-meta-pixel');   // e.g. '1234567890123456'

  var ADS_LABELS = {
    call:       cfg('data-label-call'),        // tapped a "Call Now" / phone link
    whatsapp:   cfg('data-label-whatsapp'),    // tapped a WhatsApp link or the FAB
    enquiry:    cfg('data-label-enquiry'),     // completed the enquiry form
    directions: cfg('data-label-directions')   // tapped "Get Directions"
  };
  /* ---------- END CONFIG ---------- */


  var hasGoogle = !!(GA4_ID || GOOGLE_ADS_ID);
  var hasMeta   = !!META_PIXEL_ID;
  if (!hasGoogle && !hasMeta) return;   // nothing configured — do nothing at all

  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  /* ---------------------------------------------------------
     GOOGLE — one gtag.js load serves both GA4 and Google Ads.
     Loading it twice (once per product) is a common mistake that
     double-counts everything; one loader, two config calls.
     --------------------------------------------------------- */
  if (hasGoogle) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('js', new Date());

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_ID || GOOGLE_ADS_ID);
    document.head.appendChild(s);

    if (GA4_ID)        gtag('config', GA4_ID);
    if (GOOGLE_ADS_ID) gtag('config', GOOGLE_ADS_ID);
  }

  /* ---------------------------------------------------------
     META PIXEL — standard snippet, only injected when an ID exists.
     --------------------------------------------------------- */
  if (hasMeta) {
    /* eslint-disable */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    fbq('init', META_PIXEL_ID);
    fbq('track', 'PageView');
  }

  /* ---------------------------------------------------------
     One helper, three destinations. Every conversion below goes
     to GA4 (for reporting), Google Ads (for bidding) and Meta
     (for bidding) in a single call, so the three can never drift.
     --------------------------------------------------------- */
  function track(name, metaEvent, adsLabelKey, params) {
    params = params || {};

    if (GA4_ID && window.gtag) {
      gtag('event', name, params);
    }

    var label = ADS_LABELS[adsLabelKey];
    if (GOOGLE_ADS_ID && label && window.gtag) {
      gtag('event', 'conversion', { send_to: GOOGLE_ADS_ID + '/' + label });
    }

    if (hasMeta && window.fbq) {
      /* Contact/Lead are Meta's standard events — using the standard names
         (rather than custom ones) is what lets Meta optimise delivery for
         them. Anything without a standard equivalent goes as a custom event. */
      if (metaEvent === 'Contact' || metaEvent === 'Lead' || metaEvent === 'FindLocation') {
        fbq('track', metaEvent, params);
      } else {
        fbq('trackCustom', metaEvent, params);
      }
    }
  }

  /* ---------------------------------------------------------
     CONVERSION EVENTS
     Bound with delegation on document, so links cloned or
     injected later (the catalog modal's WhatsApp button, for
     instance) are covered without re-binding.
     --------------------------------------------------------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';

    if (href.indexOf('tel:') === 0) {
      track('call_click', 'Contact', 'call', { method: 'phone' });
    } else if (href.indexOf('wa.me') !== -1 || href.indexOf('whatsapp.com') !== -1) {
      track('whatsapp_click', 'Contact', 'whatsapp', { method: 'whatsapp' });
    } else if (href.indexOf('share.google') !== -1 || href.indexOf('google.com/maps') !== -1) {
      track('directions_click', 'FindLocation', 'directions', {});
    }
  }, true);

  /* The enquiry form. main.js §10 dispatches this only after validation
     passed AND the WhatsApp tab actually opened — see the comment there.
     Binding our own submit listener instead would count failed validations. */
  document.addEventListener('vsps:enquiry-sent', function (e) {
    var topic = (e.detail && e.detail.topic) || '';
    track('enquiry_submit', 'Lead', 'enquiry', { topic: topic });
  });

  /* Engagement, not a conversion — useful in GA4 to see which categories
     people actually browse, deliberately NOT wired to an Ads label. */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-catalog-trigger]');
    if (!btn) return;
    var card  = btn.closest('.cat');
    var title = card && card.querySelector('.cat__title');
    track('view_catalog', 'ViewContent', null, {
      category: title ? title.textContent.trim() : btn.getAttribute('data-catalog-trigger')
    });
  }, true);

})();
