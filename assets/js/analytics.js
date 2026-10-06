/* =========================================================
   VS PET SHOP — GTM event bridge
   Vanilla JS. No dependencies, no build step. Loaded `defer`.

   -- GA4 / Google Ads conversions / Meta Pixel are configured INSIDE the
   Google Tag Manager container (tagmanager.google.com), NOT in this file. --
   GTM itself is installed directly in index.html (the standard head/body
   snippet pair Google generates) -- see the comments next to both snippets
   there. This replaces the older direct-gtag.js wiring this file used to do
   (see git history / CLAUDE.md section 11 for that era, kept for context only).

   WHAT THIS FILE DOES
   --------------------
   Exactly one job: detect the interactions this site treats as meaningful
   and push a plain dataLayer event for each. GTM's own triggers (Custom
   Event, matching on event name) pick these up and fire whichever tags are
   configured against them in the container -- this file never calls
   gtag()/fbq() directly and knows nothing about GA4 IDs, Ads conversion
   labels or pixel IDs. Adding/removing a destination (GA4, a new Ads
   conversion action, Meta pixel) is now a pure GTM container change +
   Publish; it never touches this file again.

   EVENTS PUSHED (dataLayer.push({event: '...', ...params}))
   -----------------------------------------------------------
   call_click        { method: 'phone' }    -- tapped a tel: link
   whatsapp_click    { method: 'whatsapp' } -- tapped a wa.me / whatsapp.com link
   directions_click  {}                     -- tapped the Maps / share.google link
   enquiry_submit    { topic }              -- enquiry form sent (main.js section 10
                                               dispatches vsps:enquiry-sent only
                                               after validation passed AND the
                                               WhatsApp tab actually opened --
                                               see the comment there; binding a
                                               submit listener here directly
                                               would count failed validations)
   view_catalog      { category }           -- opened a category's "View
                                               Catalog" popup. Engagement, not
                                               a conversion -- wire this as a
                                               GA4-only trigger/tag in GTM, no
                                               Ads conversion action attached,
                                               or every campaign ends up
                                               looking artificially successful.

   WHAT COUNTS AS A CONVERSION ON THIS SITE
   ----------------------------------------
   There is no cart and no checkout. The only real actions a visitor can take
   are: phone the shop, message it on WhatsApp, ask for directions, or send
   the enquiry form. Those four map to Google Ads conversion actions inside
   GTM. Do not wire "page_view" or "view_catalog" to an Ads conversion -- it
   will make every campaign look successful while telling you nothing.

   A NOTE ON WHAT IS AND ISN'T POSSIBLE HERE
   -----------------------------------------
   This site has no backend (CLAUDE.md section 1). So whatever tags live inside GTM:
   - Meta's Conversions API (server-side) cannot be implemented -- browser
     pixel only. Expect Meta to under-report; platform reality, not a bug.
   - Google Ads Enhanced Conversions (hashed email/phone) would need the
     account-level automatic web variant (reads the enquiry form's own
     fields) -- see CLAUDE.md section 11 for how that one actually works here.
   ========================================================= */
(function () {
  'use strict';

  window.dataLayer = window.dataLayer || [];

  var push = function (name, params) {
    var evt = { event: name };
    for (var k in params) { if (params.hasOwnProperty(k)) evt[k] = params[k]; }
    window.dataLayer.push(evt);
  };

  /* ---------------------------------------------------------
     Bound with delegation on document, so links cloned or
     injected later (the catalog modal's WhatsApp button, for
     instance) are covered without re-binding.
     --------------------------------------------------------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';

    if (href.indexOf('tel:') === 0) {
      push('call_click', { method: 'phone' });
    } else if (href.indexOf('wa.me') !== -1 || href.indexOf('whatsapp.com') !== -1) {
      push('whatsapp_click', { method: 'whatsapp' });
    } else if (href.indexOf('share.google') !== -1 || href.indexOf('google.com/maps') !== -1) {
      push('directions_click', {});
    }
  }, true);

  /* The enquiry form. main.js section 10 dispatches this only after validation
     passed AND the WhatsApp tab actually opened -- see the comment there.
     Binding our own submit listener instead would count failed validations. */
  document.addEventListener('vsps:enquiry-sent', function (e) {
    var topic = (e.detail && e.detail.topic) || '';
    push('enquiry_submit', { topic: topic });
  });

  /* Engagement, not a conversion -- useful in GA4 to see which categories
     people actually browse. Wire this as a GA4-only tag in GTM, not a
     Google Ads conversion action. */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-catalog-trigger]');
    if (!btn) return;
    var card  = btn.closest('.cat');
    var title = card && card.querySelector('.cat__title');
    push('view_catalog', {
      category: title ? title.textContent.trim() : btn.getAttribute('data-catalog-trigger')
    });
  }, true);

})();
