/* =========================================================
   VS PET SHOP — ADMIN CONTENT PANEL
   Vanilla JS (ES2022+), no dependencies, no build step, no fetch().

   WHAT THIS IS
   ------------
   There is no backend for this site (see CLAUDE.md §1 hard constraints),
   so this tool cannot "publish" anything by itself. What it does instead:

     1. You pick your local index.html (+ optionally main.js, robots.txt,
        sitemap.xml, 404.html) with the file input below. Files are read
        with FileReader, never fetch() — fetch() cannot reliably read
        local files from a file:// page in Chrome, FileReader always can.
     2. Your index.html is parsed with DOMParser into an in-memory
        Document. Every editable spot in that document was tagged ahead
        of time with a stable data-field="..." attribute (see CLAUDE.md
        §3, admin/ entry) so this script can find it again reliably even
        if the file gets re-ordered or restyled later.
     3. You edit plain form fields. A live <iframe srcdoc> preview shows
        the rebuilt document as you type (debounced).
     4. "Save & Download" re-serializes the edited Document back to an
        index.html file and downloads it via a temporary <a download>.
        If you changed the phone/WhatsApp number or shop name and also
        uploaded main.js, an updated main.js is offered too (only its
        two config lines change — everything else stays byte-identical).
        If you changed the domain and uploaded robots.txt / sitemap.xml /
        404.html, those get the same literal domain replace and are
        offered as extra downloads.
     5. YOU still have to upload those downloaded files to Hostinger
        (File Manager or FTP) yourself. This tool never touches the
        live site.

   PASSPHRASE GATE — HOW TO CHANGE IT
   -----------------------------------
   The gate below compares SHA-256(passphrase) as a hex string against
   ADMIN_PASS_HASH. The plaintext passphrase is intentionally NEVER stored
   in this file — this repo is public, and anything written here in plain
   text (even in a comment) is effectively public too. The current
   passphrase was shared with the shop owner directly (WhatsApp), not
   committed anywhere. To change it:
     1. Open any browser console (on any page) and run:
          crypto.subtle.digest('SHA-256', new TextEncoder().encode('your-new-passphrase'))
            .then(buf => console.log([...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('')))
     2. Copy the printed 64-character hex string.
     3. Replace the ADMIN_PASS_HASH value below with it.
     4. Tell the shop owner the new passphrase out of band (WhatsApp, not
        in this file, not in a commit message).
   Reminder: this is a client-side speed bump, NOT authentication. Anyone
   who can view-source this page can read this comment and bypass it.
   Never share the admin/ link publicly, and keep this folder out of
   search engines (robots.txt already disallows /admin/, and this page
   carries <meta name="robots" content="noindex, nofollow">).
   ========================================================= */
(function () {
  'use strict';

  var ADMIN_PASS_HASH = 'f394908a5828a85a81f31dedc46326257e715bb56a27bc967430000e19f7be07'; // sha256 of the current passphrase — see comment block above, never write the plaintext here
  /* Fallback only, for the rare case where the loaded index.html has no
     usable <link rel="canonical">. The domain actually used for the
     search-and-replace is state.site.origDomain, read from the loaded
     document in initEditor(). It MUST NOT be a hardcoded constant: this was
     pinned to the old placeholder domain, so after the site moved to
     vspetshop.com the string matched nothing and the Domain field became a
     silent no-op — the preview showed no change and the downloaded file kept
     the old URLs, with no error. */
  var DEFAULT_DOMAIN = 'https://vspetshop.com';

  var $  = (s, c) => (c || document).querySelector(s);
  var $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  function debounce(fn, ms) {
    let t;
    return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* ---------------------------------------------------------
     Text helpers for elements that mix an icon <svg> with a
     text node (a lot of this site's markup does — a button is
     "<svg>...</svg> Label", or "Label<svg class=chev>...</svg>"
     for the FAQ chevron). We only ever touch the text node, the
     icon element is left completely alone.
     --------------------------------------------------------- */
  function hasIcon(el) { return !!el.querySelector('svg'); }

  // icon FIRST, text TRAILS it (buttons, pills, topbar items)
  function getTrailingText(el) {
    if (!hasIcon(el)) return (el.textContent || '').trim();
    const last = el.lastChild;
    return last && last.nodeType === Node.TEXT_NODE ? last.textContent.trim() : '';
  }
  function setTrailingText(el, text) {
    if (!hasIcon(el)) { el.textContent = text; return; }
    const last = el.lastChild;
    if (last && last.nodeType === Node.TEXT_NODE) last.textContent = ' ' + text;
    else el.appendChild(el.ownerDocument.createTextNode(' ' + text));
  }

  // text FIRST, icon trails it (FAQ <summary>Question<svg chevron/></summary>)
  function getLeadingText(el) {
    const first = el.firstChild;
    return first && first.nodeType === Node.TEXT_NODE ? first.textContent.trim() : '';
  }
  function setLeadingText(el, text) {
    const first = el.firstChild;
    if (first && first.nodeType === Node.TEXT_NODE) first.textContent = text;
    else el.insertBefore(el.ownerDocument.createTextNode(text), el.firstChild);
  }

  function setMultilineBr(el, text) {
    const doc = el.ownerDocument;
    const lines = String(text || '').split('\n').map(l => l.trim()).filter(Boolean);
    while (el.firstChild) el.removeChild(el.firstChild);
    lines.forEach((line, i) => {
      el.appendChild(doc.createTextNode(line));
      if (i < lines.length - 1) el.appendChild(doc.createElement('br'));
    });
  }
  function getMultilineBr(el) {
    const lines = [];
    let cur = '';
    el.childNodes.forEach(n => {
      if (n.nodeType === Node.TEXT_NODE) cur += n.textContent;
      else if (n.nodeName === 'BR') { lines.push(cur.trim()); cur = ''; }
    });
    if (cur.trim()) lines.push(cur.trim());
    return lines.join('\n');
  }

  function digits10(raw) {
    let d = (raw || '').replace(/\D/g, '');
    if (d.length > 10 && d.slice(0, 2) === '91') d = d.slice(2);
    return d.slice(-10);
  }
  function formatIN(d) { return d.length === 10 ? '+91 ' + d.slice(0, 5) + ' ' + d.slice(5) : '+91 ' + d; }

  /* ---------------------------------------------------------
     STATE
     --------------------------------------------------------- */
  const state = {
    rawIndexHtml: null,
    rawMainJs: null,
    rawRobots: null,
    rawSitemap: null,
    raw404: null,
    fileNames: {},          // name -> true, for the "what did you load" list
    values: {},             // simple FIELD.key -> string value
    business: {
      phone: '', whatsapp: '', email: '',
      gmb: '', ig: '', fb: '', yt: '', ytShow: false,
      addressFull: '', addressInline: '', addressShort: '',
      ratingValue: '', reviewCount: '',
      mapSrc: ''
    },
    site: { domain: DEFAULT_DOMAIN, origDomain: DEFAULT_DOMAIN, shopName: 'VS Pet Shop', robotsIndexable: true },
    origMainJs: { whatsapp: '', shopName: '' },
    reviews: [],   // { id, row, quote, name, meta }
    faqs: [],      // { id, q, a }
    catalogs: {},  // { 'cat-1': [{ id, name, desc, img, imgAlt, price, available }], ..., 'cat-6': [...] }
    formTopics: ''
  };
  let uidSeq = 1;
  const uid = () => 'x' + (uidSeq++);

  /* ---------------------------------------------------------
     GENERIC FIELD REGISTRY
     Every entry here is a 1:1 mapping between one admin input
     and one data-field key. Composite business fields (phone,
     whatsapp, address, rating, etc. — one input, several DOM
     targets with derived formatting) are handled separately
     below in BUSINESS_FIELDS.
     --------------------------------------------------------- */
  const FIELDS = [];
  function addField(f) { FIELDS.push(f); }

  addField({ key: 'meta-title', label: 'Page Title (browser tab / search result)', input: 'text', kind: 'simple' });
  addField({ key: 'meta-desc', label: 'Meta Description', input: 'textarea', kind: 'attr', attr: 'content' });
  addField({ key: 'meta-keywords', label: 'Meta Keywords (comma separated)', input: 'textarea', kind: 'attr', attr: 'content' });
  addField({ key: 'og-title', label: 'Social Share Title (Open Graph + Twitter — WhatsApp/Facebook/Twitter link previews)', input: 'text', kind: 'attr', attr: 'content' });
  addField({ key: 'og-desc', label: 'Social Share Description (Open Graph + Twitter)', input: 'textarea', kind: 'attr', attr: 'content' });

  addField({ key: 'hero-lead', label: 'Hero Lead Paragraph', input: 'textarea', kind: 'simple' });
  addField({ key: 'hero-cta-primary', label: 'Primary Button Text', input: 'text', kind: 'smart' });
  addField({ key: 'hero-cta-secondary', label: 'Secondary Button Text', input: 'text', kind: 'smart' });
  addField({ key: 'hero-pill', label: 'Hero Pill Text', input: 'text', kind: 'smart' });
  addField({ key: 'reviews-pill', label: 'Reviews Section Pill Text', input: 'text', kind: 'smart' });

  addField({ key: 'cta-title', label: 'CTA Band Title', input: 'text', kind: 'simple' });
  addField({ key: 'cta-sub', label: 'CTA Band Subtext', input: 'textarea', kind: 'simple' });
  addField({ key: 'footer-blurb', label: 'Footer Brand Blurb', input: 'textarea', kind: 'simple' });

  addField({ key: 'stat-3-value', label: 'Stat 3 Value (e.g. 24)', input: 'text', kind: 'attr', attr: 'data-count' });
  addField({ key: 'stat-3-label', label: 'Stat 3 Label', input: 'text', kind: 'simple' });
  addField({ key: 'stat-4-value', label: 'Stat 4 Value (e.g. 3)', input: 'text', kind: 'attr', attr: 'data-count' });
  addField({ key: 'stat-4-label', label: 'Stat 4 Label', input: 'text', kind: 'simple' });

  addField({ key: 'form-topics', label: 'Enquiry Form Topics (one per line)', input: 'textarea', kind: 'select-options' });

  const CAT_NAMES = ['Dogs', 'Cats', 'Birds', 'Pet Food', 'Grooming', 'Accessories'];
  for (let n = 1; n <= 6; n++) {
    addField({ key: `cat-${n}-title`, label: `Title`, input: 'text', kind: 'simple', group: 'cat', n });
    addField({ key: `cat-${n}-desc`, label: `Description`, input: 'textarea', kind: 'simple', group: 'cat', n });
    /* 'leading', NOT 'smart'. These buttons are "Enquire <svg/>" — text FIRST,
       icon last — so getTrailingText/setTrailingText (which assume icon-first)
       read '' and appended the new label AFTER the arrow, producing
       "Enquire →Enquire Now" on every save, even a save with no edits. */
    addField({ key: `cat-${n}-cta`, label: `Button Text`, input: 'text', kind: 'leading', group: 'cat', n });
    addField({ key: `cat-${n}-img-src`, label: `Image URL`, input: 'text', kind: 'attr', attr: 'src', group: 'cat', n });
    addField({ key: `cat-${n}-img-alt`, label: `Image Alt Text`, input: 'text', kind: 'attr', attr: 'alt', group: 'cat', n });
  }

  for (let n = 1; n <= 6; n++) {
    addField({ key: `svc-${n}-title`, label: `Title`, input: 'text', kind: 'simple', group: 'svc', n });
    addField({ key: `svc-${n}-desc`, label: `Description`, input: 'textarea', kind: 'simple', group: 'svc', n });
  }

  for (let n = 1; n <= 6; n++) {
    addField({ key: `why-${n}-title`, label: `Title`, input: 'text', kind: 'simple', group: 'why', n });
    addField({ key: `why-${n}-desc`, label: `Description`, input: 'textarea', kind: 'simple', group: 'why', n });
  }

  for (let n = 1; n <= 6; n++) {
    addField({ key: `gal-${n}-src-thumb`, label: `Thumbnail Image URL`, input: 'text', kind: 'attr', attr: 'src', group: 'gal', n });
    addField({ key: `gal-${n}-src-full`, label: `Full-size (lightbox) Image URL`, input: 'text', kind: 'attr', attr: 'data-src', group: 'gal', n });
    addField({ key: `gal-${n}-caption`, label: `Caption`, input: 'text', kind: 'gallery-caption', group: 'gal', n });
  }

  const FIELD_BY_KEY = Object.fromEntries(FIELDS.map(f => [f.key, f]));

  function getFieldValue(doc, field) {
    const el = doc.querySelector(`[data-field~="${field.key}"]`);
    if (!el) return '';
    switch (field.kind) {
      case 'simple': return (el.textContent || '').trim();
      case 'smart': return getTrailingText(el);
      case 'leading': return getLeadingText(el);
      case 'attr': return el.getAttribute(field.attr) || '';
      case 'select-options': return $$('option', el).map(o => o.textContent.trim()).join('\n');
      case 'gallery-caption': return el.getAttribute('data-caption') || '';
      default: return '';
    }
  }

  function applyFieldValue(doc, field, value) {
    const els = $$(`[data-field~="${field.key}"]`, doc);
    els.forEach(el => {
      switch (field.kind) {
        case 'simple': el.textContent = value; break;
        case 'smart': setTrailingText(el, value); break;
        case 'leading': setLeadingText(el, value); break;
        case 'attr': el.setAttribute(field.attr, value); break;
        case 'select-options': {
          while (el.firstChild) el.removeChild(el.firstChild);
          value.split('\n').map(l => l.trim()).filter(Boolean).forEach(line => {
            const opt = doc.createElement('option');
            opt.textContent = line;
            el.appendChild(opt);
          });
          break;
        }
        case 'gallery-caption': {
          el.setAttribute('data-caption', value);
          el.setAttribute('aria-label', 'Open photo: ' + value);
          /* Deliberately does NOT touch img.alt. The alts are intentionally
             different from the captions (alt describes the image, the caption
             adds context), and overwriting alt with the caption destroyed all
             six of them on the owner's first save — irrecoverably, through a
             tool that gives no warning. The caption already reaches assistive
             tech via the button's aria-label set just above. */
          break;
        }
      }
    });
  }

  /* ---------------------------------------------------------
     BUSINESS FIELDS — one admin input, several DOM targets
     with derived formatting (phone/WA numbers, addresses,
     social links, rating, YouTube toggle, map embed).
     --------------------------------------------------------- */
  function readBusinessFromDoc(doc) {
    const phoneTextEl = doc.querySelector('[data-field~="phone-text"]');
    const waTextEl = doc.querySelector('[data-field~="wa-text"]');
    const emailEl = doc.querySelector('[data-field~="email-text"]');
    const gmbEl = doc.querySelector('[data-field~="gmb-href"]');
    const igEl = doc.querySelector('[data-field~="ig-href"]');
    const fbEl = doc.querySelector('[data-field~="fb-href"]');
    const ytEl = doc.querySelector('[data-field~="yt-href"]');
    const addrFullEl = doc.querySelector('[data-field~="address-full"]');
    const addrInlineEl = doc.querySelector('[data-field~="address-inline"]');
    const addrShortEl = doc.querySelector('[data-field~="address-short"]');
    const ratingEl = doc.querySelector('strong[data-field~="rating-value"]');
    const reviewEl = doc.querySelector('span[data-field~="review-count"]');
    const mapEl = doc.querySelector('[data-field~="map-src"]');

    state.business.phone = digits10(phoneTextEl ? getTrailingText(phoneTextEl) : '');
    state.business.whatsapp = digits10(waTextEl ? getTrailingText(waTextEl) : '');
    state.business.email = emailEl ? getTrailingText(emailEl) : '';
    state.business.gmb = gmbEl ? gmbEl.getAttribute('href') : '';
    state.business.ig = igEl ? igEl.getAttribute('href') : '';
    state.business.fb = fbEl ? fbEl.getAttribute('href') : '';
    state.business.yt = (ytEl && !ytEl.hasAttribute('data-todo')) ? ytEl.getAttribute('href') : '';
    state.business.ytShow = !!(ytEl && !ytEl.hasAttribute('hidden'));
    state.business.addressFull = addrFullEl ? getMultilineBr(addrFullEl) : '';
    state.business.addressInline = addrInlineEl ? addrInlineEl.textContent.trim() : '';
    state.business.addressShort = addrShortEl ? getTrailingText(addrShortEl) : '';
    state.business.ratingValue = ratingEl ? ratingEl.textContent.trim() : '5.0/5';
    state.business.reviewCount = reviewEl ? reviewEl.textContent.trim() : '18';
    state.business.mapSrc = mapEl ? mapEl.getAttribute('src') : '';
  }

  function applyBusinessToDoc(doc) {
    const b = state.business;
    const phoneD = digits10(b.phone);
    const waD = digits10(b.whatsapp);

    $$('[data-field~="phone-href"]', doc).forEach(el => el.setAttribute('href', 'tel:+91' + phoneD));
    $$('[data-field~="phone-text"]', doc).forEach(el => setTrailingText(el, formatIN(phoneD)));

    $$('[data-field~="wa-href"]', doc).forEach(el => el.setAttribute('href', 'https://wa.me/91' + waD));
    $$('[data-field~="wa-text"]', doc).forEach(el => setTrailingText(el, formatIN(waD)));

    $$('[data-field~="email-href"]', doc).forEach(el => el.setAttribute('href', 'mailto:' + b.email.trim()));
    $$('[data-field~="email-text"]', doc).forEach(el => setTrailingText(el, b.email.trim()));

    $$('[data-field~="gmb-href"]', doc).forEach(el => el.setAttribute('href', b.gmb.trim()));
    $$('[data-field~="ig-href"]', doc).forEach(el => el.setAttribute('href', b.ig.trim()));
    $$('[data-field~="fb-href"]', doc).forEach(el => el.setAttribute('href', b.fb.trim()));

    $$('[data-field~="yt-href"]', doc).forEach(el => {
      if (b.ytShow && b.yt.trim()) {
        el.setAttribute('href', b.yt.trim());
        el.removeAttribute('hidden');
        el.removeAttribute('data-todo');
      } else {
        el.setAttribute('href', '#');
        el.setAttribute('hidden', '');
        if (!el.hasAttribute('data-todo')) {
          el.setAttribute('data-todo', 'paste the YouTube channel URL in href, then delete the hidden attribute');
        }
      }
    });

    const addrFullEl = doc.querySelector('[data-field~="address-full"]');
    if (addrFullEl) setMultilineBr(addrFullEl, b.addressFull);
    const addrInlineEl = doc.querySelector('[data-field~="address-inline"]');
    if (addrInlineEl) addrInlineEl.textContent = b.addressFull.split('\n').map(l => l.trim()).filter(Boolean).join(', ') || b.addressInline;
    $$('[data-field~="address-short"]', doc).forEach(el => setTrailingText(el, b.addressShort));

    const ratingNum = parseFloat(b.ratingValue) || 0;
    $$('[data-field~="rating-value"]', doc).forEach(el => {
      if (el.hasAttribute('data-count')) el.setAttribute('data-count', String(ratingNum));
      else el.textContent = b.ratingValue;
    });
    const reviewNum = parseInt(b.reviewCount, 10) || 0;
    $$('[data-field~="review-count"]', doc).forEach(el => {
      if (el.hasAttribute('data-count')) el.setAttribute('data-count', String(reviewNum));
      else el.textContent = String(reviewNum);
    });

    $$('[data-field~="map-src"]', doc).forEach(el => el.setAttribute('src', b.mapSrc.trim()));
  }

  /* ---------------------------------------------------------
     SEO — robots meta (indexable on/off) + structured data
     (JSON-LD) sync. The JSON-LD block is kept in sync with
     Business Info so it never goes stale after an edit here:
     telephone, email, hasMap (Google Business link) and sameAs
     (Instagram/Facebook/YouTube) are rewritten from state.business
     every time the document is rebuilt. The postal address inside
     JSON-LD is intentionally NOT auto-synced from the free-text
     "Full Address" field — splitting that back into
     streetAddress/locality/region/postalCode reliably isn't
     possible from plain text, so if the address ever changes,
     edit the <script type="application/ld+json"> block in
     index.html directly as well.
     --------------------------------------------------------- */
  function applySeoRobots(doc) {
    const el = doc.querySelector('[data-field~="meta-robots"]');
    if (el) el.setAttribute('content', state.site.robotsIndexable ? 'index, follow' : 'noindex, nofollow');
  }

  function applyJsonLdToDoc(doc) {
    const script = doc.querySelector('script[type="application/ld+json"]');
    if (!script) return;
    let ld;
    try { ld = JSON.parse(script.textContent); } catch (e) { return; } // never let a bad edit crash the preview

    const b = state.business;
    const phoneD = digits10(b.phone);
    /* E.164, no separators — the form Google's own examples use and what
       click-to-call handlers expect. This MUST stay in the same format as the
       telephone value hand-written in index.html's JSON-LD, or the owner's
       next save silently rewrites it and the two drift apart. */
    if (phoneD) ld.telephone = '+91' + phoneD;
    if (b.email.trim()) ld.email = b.email.trim();
    if (b.gmb.trim()) ld.hasMap = b.gmb.trim();

    const sameAs = [];
    if (b.ig.trim()) sameAs.push(b.ig.trim());
    if (b.fb.trim()) sameAs.push(b.fb.trim());
    if (b.ytShow && b.yt.trim()) sameAs.push(b.yt.trim());
    if (sameAs.length) ld.sameAs = sameAs;

    /* Escape `<` as <. JSON.stringify does not escape it, and script
       content is serialised raw — so a URL containing "</script>" pasted into
       any social field would close the JSON-LD block early and turn the rest
       of the line into live HTML on the published page. */
    script.textContent = '\n' + JSON.stringify(ld, null, 2).replace(/</g, '\\u003c') + '\n';
  }

  /* ---------------------------------------------------------
     REVIEWS + FAQ — dynamic add / edit / delete
     --------------------------------------------------------- */
  function readReviewsFromDoc(doc) {
    state.reviews = [];
    const rows = doc.querySelectorAll('.rev__row');
    rows.forEach((row, rowIndex) => {
      $$('.rev__card', row).forEach(card => {
        const quoteEl = card.querySelector('[data-field^="rev-"][data-field$="-quote"], blockquote');
        const nameEl = card.querySelector('figcaption b');
        const metaEl = card.querySelector('figcaption span');
        state.reviews.push({
          id: uid(),
          row: rowIndex, // 0 = first row, 1 = second row
          quote: quoteEl ? quoteEl.textContent.trim() : '',
          name: nameEl ? nameEl.textContent.trim() : '',
          meta: metaEl ? metaEl.textContent.trim() : ''
        });
      });
    });
  }

  function readFaqsFromDoc(doc) {
    state.faqs = [];
    $$('.faq__item', doc).forEach(item => {
      const summary = item.querySelector('summary');
      const p = item.querySelector('.faq__body p');
      state.faqs.push({
        id: uid(),
        q: summary ? getLeadingText(summary) : '',
        a: p ? p.textContent.trim() : ''
      });
    });
  }

  function buildReviewCardEl(doc, review, index) {
    const fig = doc.createElement('figure');
    fig.className = 'rev__card';
    fig.innerHTML =
      '<div class="rev__stars" aria-label="5 out of 5 stars">' +
      Array(5).fill('<svg class="ic"><use href="#i-star"/></svg>').join('') +
      '</div>' +
      `<blockquote data-field="rev-${index}-quote"></blockquote>` +
      `<figcaption><b data-field="rev-${index}-name"></b><span data-field="rev-${index}-meta"></span></figcaption>`;
    fig.querySelector('blockquote').textContent = review.quote;
    fig.querySelector('figcaption b').textContent = review.name;
    fig.querySelector('figcaption span').textContent = review.meta;
    return fig;
  }

  function applyReviewsToDoc(doc) {
    const rowEls = doc.querySelectorAll('.rev__row');
    const row0set = rowEls[0] && rowEls[0].querySelector('.rev__set');
    const row1set = rowEls[1] && rowEls[1].querySelector('.rev__set');
    if (!row0set) return;
    while (row0set.firstChild) row0set.removeChild(row0set.firstChild);
    if (row1set) while (row1set.firstChild) row1set.removeChild(row1set.firstChild);

    let i = 1;
    state.reviews.forEach(r => {
      const target = (r.row === 1 && row1set) ? row1set : row0set;
      target.appendChild(buildReviewCardEl(doc, r, i));
      i++;
    });
  }

  function buildFaqItemEl(doc, faq, index) {
    const details = doc.createElement('details');
    details.className = 'faq__item';
    details.innerHTML =
      `<summary data-field="faq-${index}-q"></summary>` +
      `<div class="faq__body"><p data-field="faq-${index}-a"></p></div>`;
    const summary = details.querySelector('summary');
    summary.appendChild(doc.createTextNode(faq.q));
    const chev = doc.createElement('svg');
    chev.setAttribute('class', 'ic faq__chev');
    chev.innerHTML = '<use href="#i-chev-down"/>';
    summary.appendChild(chev);
    details.querySelector('.faq__body p').textContent = faq.a;
    return details;
  }

  function applyFaqsToDoc(doc) {
    const container = doc.querySelector('.faq');
    if (!container) return;
    while (container.firstChild) container.removeChild(container.firstChild);
    state.faqs.forEach((f, idx) => container.appendChild(buildFaqItemEl(doc, f, idx + 1)));
  }

  /* ---------------------------------------------------------
     CATALOG ITEMS — dynamic add / edit / delete, per category.

     Each category card carries a
     <template class="cat__catalog" data-catalog-for="cat-N"> holding its
     catalog items (see main.js §17 and CSS "CATALOG MODAL"). Items are
     full product cards: name (also doubles as the breed/product name),
     photo (src + alt, via the site's existing .ph graceful-fallback photo
     frame — see CSS "CATALOG MODAL" comment and main.js §14/§17), an
     OPTIONAL free-text price (hidden entirely when blank — this is a
     deliberate, practical resolution of CLAUDE.md §2's formerly-open
     "should prices be shown" question: it's now the owner's per-product
     choice, not a site-wide decision), a short description, and an
     in-stock/unavailable badge. The 19 items seeded in an earlier session
     were generic placeholders derived from each category's own approved
     description copy (CLAUDE.md §7) — they keep their original name/desc
     text, but now start with no photo and no price until the owner fills
     those in for real. Renumbering after an add/delete is cosmetic-only
     here, same tolerance as the review/FAQ lists above (CLAUDE.md §9) —
     it does not need to stay perfectly contiguous.
     --------------------------------------------------------- */
  function readCatalogsFromDoc(doc) {
    state.catalogs = {};
    for (let n = 1; n <= 6; n++) {
      const key = `cat-${n}`;
      const tpl = doc.querySelector(`template[data-catalog-for="${key}"]`);
      const items = [];
      if (tpl && tpl.content) {
        $$('.catmodal__item', tpl.content).forEach(item => {
          const nameEl = item.querySelector('h4');
          const descEl = item.querySelector('p');
          const imgEl = item.querySelector('img');
          const priceEl = item.querySelector('.catmodal__item-price');
          const availEl = item.querySelector('.catmodal__item-badge');
          items.push({
            id: uid(),
            name: nameEl ? nameEl.textContent.trim() : '',
            desc: descEl ? descEl.textContent.trim() : '',
            img: imgEl ? (imgEl.getAttribute('src') || '') : '',
            imgAlt: imgEl ? (imgEl.getAttribute('alt') || '') : '',
            price: priceEl ? (priceEl.textContent || '').trim() : '',
            // Missing badge, or a badge that isn't explicitly marked
            // unavailable, defaults to in-stock — matches every seeded item.
            available: availEl ? !availEl.classList.contains('is-unavail') : true
          });
        });
      }
      state.catalogs[key] = items;
    }
  }

  function buildCatalogItemEl(doc, item, catN, index) {
    const art = doc.createElement('article');
    art.className = 'catmodal__item';
    const fieldKey = `cat-${catN}-catalog-${index}`;
    art.setAttribute('data-field', fieldKey);
    const hasPrice = !!(item.price && item.price.trim());
    const available = item.available !== false;
    art.innerHTML =
      `<figure class="ph catmodal__item-img"><img data-field="${fieldKey}-img-src ${fieldKey}-img-alt" loading="lazy"></figure>` +
      `<div class="catmodal__item-body">` +
        `<div class="catmodal__item-row">` +
          `<h4 data-field="${fieldKey}-name"></h4>` +
          `<span class="catmodal__item-price" data-field="${fieldKey}-price"${hasPrice ? '' : ' hidden'}></span>` +
        `</div>` +
        `<p data-field="${fieldKey}-desc"></p>` +
        `<span class="catmodal__item-badge ${available ? 'is-avail' : 'is-unavail'}" data-field="${fieldKey}-avail"></span>` +
      `</div>`;
    const img = art.querySelector('img');
    img.setAttribute('src', item.img || '');
    img.setAttribute('alt', item.imgAlt || '');
    art.querySelector('h4').textContent = item.name;
    art.querySelector('p').textContent = item.desc;
    art.querySelector('.catmodal__item-price').textContent = hasPrice ? item.price.trim() : '';
    art.querySelector('.catmodal__item-badge').textContent = available ? 'In Stock' : 'Currently Unavailable';
    return art;
  }

  function applyCatalogsToDoc(doc) {
    for (let n = 1; n <= 6; n++) {
      const key = `cat-${n}`;
      const tpl = doc.querySelector(`template[data-catalog-for="${key}"]`);
      if (!tpl || !tpl.content) continue;
      while (tpl.content.firstChild) tpl.content.removeChild(tpl.content.firstChild);
      (state.catalogs[key] || []).forEach((item, idx) => {
        tpl.content.appendChild(buildCatalogItemEl(doc, item, n, idx + 1));
      });
    }
  }

  /* ---------------------------------------------------------
     DOCUMENT PIPELINE — always rebuilt from the ORIGINAL raw
     text + current state, never mutated incrementally. This
     keeps preview/save/reset all consistent and simple.
     --------------------------------------------------------- */
  function normDomain() {
    return (state.site.domain || '').trim().replace(/\/+$/, '');
  }

  function buildDocument() {
    let text = state.rawIndexHtml;
    const newDomain = normDomain();
    if (newDomain && newDomain !== state.site.origDomain) {
      text = text.split(state.site.origDomain).join(newDomain);
    }
    const doc = new DOMParser().parseFromString(text, 'text/html');

    FIELDS.forEach(f => applyFieldValue(doc, f, state.values[f.key] ?? ''));
    applyBusinessToDoc(doc);
    applySeoRobots(doc);
    applyJsonLdToDoc(doc);
    applyReviewsToDoc(doc);
    applyFaqsToDoc(doc);
    applyCatalogsToDoc(doc);

    return doc;
  }

  function serializeDoc(doc) {
    return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
  }

  const updatePreview = debounce(() => {
    const preview = $('#admPreview');
    if (!preview || !state.rawIndexHtml) return;
    try {
      preview.srcdoc = serializeDoc(buildDocument());
    } catch (err) {
      preview.srcdoc = '<pre style="padding:20px;color:#B42318">Preview error: ' + escapeHtml(err.message) + '</pre>';
    }
  }, 300);

  /* ---------------------------------------------------------
     FILE LOADING (FileReader only — no fetch())
     --------------------------------------------------------- */
  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList);
    for (const file of files) {
      const name = file.name.toLowerCase();
      const text = await readFileAsText(file);
      if (name === 'index.html') { state.rawIndexHtml = text; state.fileNames.index = file.name; }
      else if (name === 'main.js') { state.rawMainJs = text; state.fileNames.main = file.name; }
      else if (name === 'robots.txt') { state.rawRobots = text; state.fileNames.robots = file.name; }
      else if (name === 'sitemap.xml') { state.rawSitemap = text; state.fileNames.sitemap = file.name; }
      else if (name === '404.html') { state.raw404 = text; state.fileNames['404'] = file.name; }
    }
    renderFileList();
    if (state.rawIndexHtml) initEditor();
  }

  function renderFileList() {
    const ul = $('#admFileList');
    if (!ul) return;
    const rows = [
      ['index', 'index.html (required)'],
      ['main', 'assets/js/main.js (optional)'],
      ['robots', 'robots.txt (optional)'],
      ['sitemap', 'sitemap.xml (optional)'],
      ['404', '404.html (optional)']
    ];
    ul.innerHTML = rows.map(([k, label]) => {
      const ok = !!state.fileNames[k];
      return `<li class="${ok ? 'is-ok' : 'is-missing'}"><svg class="ic" style="width:14px;height:14px"><use href="#${ok ? 'i-check' : 'i-file'}"/></svg> ${escapeHtml(label)}${ok ? ' — loaded' : ''}</li>`;
    }).join('');
  }

  /* ---------------------------------------------------------
     UI RENDERING
     --------------------------------------------------------- */
  function el(tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'html') e.innerHTML = v; else e.setAttribute(k, v);
    });
    (children || []).forEach(c => e.appendChild(c));
    return e;
  }

  function fieldInputHtml(field, value) {
    const idAttr = `data-fkey="${field.key}"`;
    if (field.input === 'textarea') {
      return `<textarea ${idAttr} rows="3">${escapeHtml(value)}</textarea>`;
    }
    return `<input type="text" ${idAttr} value="${escapeHtml(value)}">`;
  }

  function renderSimpleFieldsInto(container, fields) {
    fields.forEach(f => {
      const wrap = el('div', { class: 'adm-field' }, []);
      wrap.innerHTML = `<label for="f_${f.key}">${escapeHtml(f.label)}</label>${fieldInputHtml(f, state.values[f.key] || '')}`;
      const input = wrap.querySelector('[data-fkey]');
      input.id = `f_${f.key}`;
      input.addEventListener('input', () => { state.values[f.key] = input.value; updatePreview(); });
      container.appendChild(wrap);
    });
  }

  function makeSection(title, openByDefault) {
    const section = el('div', { class: 'adm-section' + (openByDefault ? ' is-open' : '') });
    const head = el('button', { type: 'button', class: 'adm-section__head' });
    head.innerHTML = `<span>${escapeHtml(title)}</span><svg class="ic"><use href="#i-chev"/></svg>`;
    const body = el('div', { class: 'adm-section__body' });
    if (!openByDefault) body.hidden = true;
    head.addEventListener('click', () => {
      const willOpen = !section.classList.contains('is-open');
      section.classList.toggle('is-open', willOpen);
      body.hidden = !willOpen;
    });
    section.appendChild(head);
    section.appendChild(body);
    return { section, body };
  }

  function businessField(label, hint, getVal, setVal, type) {
    const wrap = el('div', { class: 'adm-field' });
    const inputId = 'bf_' + Math.random().toString(36).slice(2);
    wrap.innerHTML =
      `<label for="${inputId}">${escapeHtml(label)}</label>` +
      `<input type="${type || 'text'}" id="${inputId}" value="${escapeHtml(getVal())}">` +
      (hint ? `<small class="adm-hint">${escapeHtml(hint)}</small>` : '');
    const input = wrap.querySelector('input');
    input.addEventListener('input', () => { setVal(input.value); updatePreview(); });
    return wrap;
  }

  function businessCheckbox(label, getVal, setVal) {
    const wrap = el('div', { class: 'adm-field adm-field--checkbox' });
    const id = 'bf_' + Math.random().toString(36).slice(2);
    wrap.innerHTML = `<input type="checkbox" id="${id}" ${getVal() ? 'checked' : ''}><label for="${id}">${escapeHtml(label)}</label>`;
    const input = wrap.querySelector('input');
    input.addEventListener('change', () => { setVal(input.checked); updatePreview(); });
    return wrap;
  }

  function renderAllSections() {
    const root = $('#admSections');
    root.innerHTML = '';

    /* ---- Site Settings ---- */
    {
      const { section, body } = makeSection('Site Settings', true);
      body.appendChild(businessField('Domain', `Current: ${state.site.origDomain}. Change this only once you have the real domain — it replaces every occurrence across canonical link, Open Graph tags and structured data (and robots.txt / sitemap.xml / 404.html if you loaded them).`,
        () => state.site.domain, v => { state.site.domain = v; }));
      body.appendChild(businessField('Shop Name (used in the WhatsApp message main.js builds)', 'Only regenerates main.js if changed, and only if you loaded main.js above.',
        () => state.site.shopName, v => { state.site.shopName = v; }));
      renderSimpleFieldsInto(body, [FIELD_BY_KEY['meta-title'], FIELD_BY_KEY['meta-desc'], FIELD_BY_KEY['meta-keywords']]);
      root.appendChild(section);
    }

    /* ---- SEO ---- */
    {
      const { section, body } = makeSection('SEO', true);
      const note = el('p', { style: 'font-size:.8rem;color:var(--ink-soft);margin:0 0 10px' });
      note.textContent = 'Page Title, Meta Description and Meta Keywords are in Site Settings above — those control the Google search-result snippet. The fields below control social-media link previews (WhatsApp, Facebook, Twitter) and search-engine indexing.';
      body.appendChild(note);
      renderSimpleFieldsInto(body, [FIELD_BY_KEY['og-title'], FIELD_BY_KEY['og-desc']]);
      body.appendChild(businessCheckbox(
        'Allow search engines to index this site (turn OFF only while the site is unfinished — e.g. real photos/domain not set yet)',
        () => state.site.robotsIndexable, v => { state.site.robotsIndexable = v; }
      ));
      const ldNote = el('p', { style: 'font-size:.8rem;color:var(--ink-soft);margin-top:10px' });
      ldNote.innerHTML = 'Structured data (the invisible "rich result" info Google reads) is kept in sync automatically from Business Info below — phone, email, Google Business link, Instagram/Facebook/YouTube. ' +
        '<strong>Exception:</strong> the structured-data postal address does not auto-update from the Full Address field — if the shop ever moves, also edit the JSON-LD block directly in index.html.';
      body.appendChild(ldNote);
      root.appendChild(section);
    }

    /* ---- Business Info ---- */
    {
      const { section, body } = makeSection('Business Info', true);
      const row1 = el('div', { class: 'adm-row' });
      row1.appendChild(businessField('Phone Number', '10 digits, no +91 (used for every "Call" link).', () => state.business.phone, v => state.business.phone = digits10(v), 'tel'));
      row1.appendChild(businessField('WhatsApp Number', '10 digits, no +91 (used for every WhatsApp link).', () => state.business.whatsapp, v => state.business.whatsapp = digits10(v), 'tel'));
      body.appendChild(row1);

      body.appendChild(businessField('Email', '', () => state.business.email, v => state.business.email = v, 'email'));
      body.appendChild(businessField('Full Address (one line per line — used in the contact section)', 'Written back joined with line breaks.', () => state.business.addressFull, v => state.business.addressFull = v));
      body.appendChild(businessField('Short Address (topbar)', '', () => state.business.addressShort, v => state.business.addressShort = v));

      const row2 = el('div', { class: 'adm-row' });
      row2.appendChild(businessField('Google Rating (e.g. 5.0/5)', '', () => state.business.ratingValue, v => state.business.ratingValue = v));
      row2.appendChild(businessField('Google Review Count', '', () => state.business.reviewCount, v => state.business.reviewCount = v));
      body.appendChild(row2);

      body.appendChild(businessField('Google Business / Directions Link', 'Applied to the hero rating card, contact "Get Directions", mobile bar, and reviews section link.', () => state.business.gmb, v => state.business.gmb = v, 'url'));
      body.appendChild(businessField('Instagram URL', '', () => state.business.ig, v => state.business.ig = v, 'url'));
      body.appendChild(businessField('Facebook URL', '', () => state.business.fb, v => state.business.fb = v, 'url'));
      body.appendChild(businessField('YouTube Channel URL', '', () => state.business.yt, v => state.business.yt = v, 'url'));
      body.appendChild(businessCheckbox('Show YouTube link on the site', () => state.business.ytShow, v => state.business.ytShow = v));

      const adv = el('div', { class: 'adm-advanced' });
      adv.appendChild(businessField('Google Maps Embed URL', 'Only change this if you know what you are doing — it is the raw Google Maps embed src.', () => state.business.mapSrc, v => state.business.mapSrc = v, 'url'));
      body.appendChild(adv);

      renderSimpleFieldsInto(body, [FIELD_BY_KEY['hero-pill'], FIELD_BY_KEY['reviews-pill']]);
      root.appendChild(section);
    }

    /* ---- Hero ---- */
    {
      const { section, body } = makeSection('Hero');
      renderSimpleFieldsInto(body, [FIELD_BY_KEY['hero-lead'], FIELD_BY_KEY['hero-cta-primary'], FIELD_BY_KEY['hero-cta-secondary']]);
      const note = el('p', { style: 'font-size:.8rem;color:var(--ink-soft)' });
      note.textContent = 'The big styled headline ("Where Every Pet Feels at Home") is not editable here — it has a manual line break and an accent span baked in. Edit it directly in index.html if it ever needs to change.';
      body.appendChild(note);
      root.appendChild(section);
    }

    /* ---- Categories ---- */
    {
      const { section, body } = makeSection('Categories (6 cards)');
      const grid = el('div', { class: 'adm-subgrid' });
      for (let n = 1; n <= 6; n++) {
        const card = el('div', { class: 'adm-card' });
        card.appendChild(el('div', { class: 'adm-card__title', html: escapeHtml(CAT_NAMES[n - 1]) }));
        renderSimpleFieldsInto(card, [FIELD_BY_KEY[`cat-${n}-title`], FIELD_BY_KEY[`cat-${n}-desc`], FIELD_BY_KEY[`cat-${n}-cta`], FIELD_BY_KEY[`cat-${n}-img-src`], FIELD_BY_KEY[`cat-${n}-img-alt`]]);

        const catalogWrap = el('div', { class: 'adm-catalog', style: 'margin-top:10px;padding-top:10px;border-top:1px dashed var(--line)' });
        catalogWrap.appendChild(el('div', { class: 'adm-card__title', style: 'margin-top:0', html: 'Catalog items (the "View Catalog" popup)' }));
        const catalogList = el('div', { style: 'display:flex;flex-direction:column;gap:8px' });
        catalogWrap.appendChild(catalogList);
        const addCatBtn = el('button', { type: 'button', class: 'adm-btn adm-btn--ghost adm-btn--sm' });
        addCatBtn.innerHTML = '<svg class="ic" style="width:14px;height:14px"><use href="#i-plus"/></svg> Add Item';
        addCatBtn.addEventListener('click', () => {
          const key = `cat-${n}`;
          (state.catalogs[key] || (state.catalogs[key] = [])).push({ id: uid(), name: '', desc: '', img: '', imgAlt: '', price: '', available: true });
          renderCatalogList(n, catalogList);
          updatePreview();
        });
        catalogWrap.appendChild(addCatBtn);
        card.appendChild(catalogWrap);
        renderCatalogList(n, catalogList);

        grid.appendChild(card);
      }
      body.appendChild(grid);
      root.appendChild(section);
    }

    /* ---- Services ---- */
    {
      const { section, body } = makeSection('Services (6 cards)');
      const grid = el('div', { class: 'adm-subgrid' });
      for (let n = 1; n <= 6; n++) {
        const card = el('div', { class: 'adm-card' });
        card.appendChild(el('div', { class: 'adm-card__title', html: `Service ${n}` }));
        renderSimpleFieldsInto(card, [FIELD_BY_KEY[`svc-${n}-title`], FIELD_BY_KEY[`svc-${n}-desc`]]);
        grid.appendChild(card);
      }
      body.appendChild(grid);
      root.appendChild(section);
    }

    /* ---- Why Us + Stats ---- */
    {
      const { section, body } = makeSection('Why Us + Stats');
      const grid = el('div', { class: 'adm-subgrid' });
      for (let n = 1; n <= 6; n++) {
        const card = el('div', { class: 'adm-card' });
        card.appendChild(el('div', { class: 'adm-card__title', html: `Why Us ${n}` }));
        renderSimpleFieldsInto(card, [FIELD_BY_KEY[`why-${n}-title`], FIELD_BY_KEY[`why-${n}-desc`]]);
        grid.appendChild(card);
      }
      body.appendChild(grid);
      const statsNote = el('p', { style: 'font-size:.8rem;color:var(--ink-soft);margin-top:6px' });
      statsNote.textContent = 'The first two stat counters (Google Rating, Review Count) are set in Business Info above — they share the same values shown on the hero card.';
      body.appendChild(statsNote);
      renderSimpleFieldsInto(body, [FIELD_BY_KEY['stat-3-value'], FIELD_BY_KEY['stat-3-label'], FIELD_BY_KEY['stat-4-value'], FIELD_BY_KEY['stat-4-label']]);
      root.appendChild(section);
    }

    /* ---- Gallery ---- */
    {
      const { section, body } = makeSection('Gallery (6 photos)');
      const grid = el('div', { class: 'adm-subgrid' });
      for (let n = 1; n <= 6; n++) {
        const card = el('div', { class: 'adm-card' });
        card.appendChild(el('div', { class: 'adm-card__title', html: `Photo ${n}` }));
        renderSimpleFieldsInto(card, [FIELD_BY_KEY[`gal-${n}-caption`], FIELD_BY_KEY[`gal-${n}-src-thumb`], FIELD_BY_KEY[`gal-${n}-src-full`]]);
        grid.appendChild(card);
      }
      body.appendChild(grid);
      root.appendChild(section);
    }

    /* ---- Reviews ---- */
    {
      const { section, body } = makeSection('Reviews');
      const warn = el('div', { class: 'adm-warn' });
      warn.innerHTML = '<svg class="ic"><use href="#i-warn"/></svg><div>⚠️ Yeh saare verbatim real Google reviews hain (CLAUDE.md §6 content integrity rule). Ye tool inka wording change karne se nahi rokega, lekin: kisi maujooda review ka text mat badlo — sirf naya REAL customer review add karo ya explicitly-confirmed-fake/duplicate ko hi hatao.</div>';
      warn.style.margin = '0 0 4px';
      body.appendChild(warn);
      const list = el('div', { id: 'admReviewList', style: 'display:flex;flex-direction:column;gap:10px' });
      body.appendChild(list);
      const addRow = el('div', { class: 'adm-add-row' });
      const addBtn = el('button', { type: 'button', class: 'adm-btn adm-btn--ghost adm-btn--sm' });
      addBtn.innerHTML = '<svg class="ic" style="width:16px;height:16px"><use href="#i-plus"/></svg> Add Review';
      addBtn.addEventListener('click', () => {
        state.reviews.push({ id: uid(), row: 0, quote: '', name: '', meta: 'Google review' });
        renderReviewList();
        updatePreview();
      });
      addRow.appendChild(addBtn);
      body.appendChild(addRow);
      root.appendChild(section);
      renderReviewList();
    }

    /* ---- FAQ ---- */
    {
      const { section, body } = makeSection('FAQ');
      const list = el('div', { id: 'admFaqList', style: 'display:flex;flex-direction:column;gap:10px' });
      body.appendChild(list);
      const addRow = el('div', { class: 'adm-add-row' });
      const addBtn = el('button', { type: 'button', class: 'adm-btn adm-btn--ghost adm-btn--sm' });
      addBtn.innerHTML = '<svg class="ic" style="width:16px;height:16px"><use href="#i-plus"/></svg> Add FAQ';
      addBtn.addEventListener('click', () => {
        state.faqs.push({ id: uid(), q: '', a: '' });
        renderFaqList();
        updatePreview();
      });
      addRow.appendChild(addBtn);
      body.appendChild(addRow);
      root.appendChild(section);
      renderFaqList();
    }

    /* ---- CTA Band / Footer / Enquiry topics ---- */
    {
      const { section, body } = makeSection('CTA Band, Footer &amp; Enquiry Form');
      renderSimpleFieldsInto(body, [FIELD_BY_KEY['cta-title'], FIELD_BY_KEY['cta-sub'], FIELD_BY_KEY['footer-blurb'], FIELD_BY_KEY['form-topics']]);
      root.appendChild(section);
    }
  }

  function renderReviewList() {
    const list = $('#admReviewList');
    if (!list) return;
    list.innerHTML = '';
    state.reviews.forEach(r => {
      const item = el('div', { class: 'adm-item' });
      const head = el('div', { class: 'adm-item__head' });
      head.innerHTML = `<b>${escapeHtml(r.name || 'New review')} — row ${r.row === 1 ? '2' : '1'}</b>`;
      const delBtn = el('button', { type: 'button', class: 'adm-btn adm-btn--danger adm-btn--sm' });
      delBtn.innerHTML = '<svg class="ic" style="width:14px;height:14px"><use href="#i-trash"/></svg> Delete';
      delBtn.addEventListener('click', () => {
        state.reviews = state.reviews.filter(x => x.id !== r.id);
        renderReviewList();
        updatePreview();
      });
      head.appendChild(delBtn);
      item.appendChild(head);

      const qWrap = el('div', { class: 'adm-field' });
      qWrap.innerHTML = '<label>Quote</label><textarea rows="3"></textarea>';
      qWrap.querySelector('textarea').value = r.quote;
      qWrap.querySelector('textarea').addEventListener('input', e => { r.quote = e.target.value; updatePreview(); });
      item.appendChild(qWrap);

      const row = el('div', { class: 'adm-row' });
      const nameWrap = el('div', { class: 'adm-field' });
      nameWrap.innerHTML = '<label>Name</label><input type="text">';
      nameWrap.querySelector('input').value = r.name;
      nameWrap.querySelector('input').addEventListener('input', e => { r.name = e.target.value; head.querySelector('b').textContent = `${e.target.value || 'New review'} — row ${r.row === 1 ? '2' : '1'}`; updatePreview(); });
      row.appendChild(nameWrap);

      const metaWrap = el('div', { class: 'adm-field' });
      metaWrap.innerHTML = '<label>Meta (e.g. "Google review · 2 months ago")</label><input type="text">';
      metaWrap.querySelector('input').value = r.meta;
      metaWrap.querySelector('input').addEventListener('input', e => { r.meta = e.target.value; updatePreview(); });
      row.appendChild(metaWrap);
      item.appendChild(row);

      list.appendChild(item);
    });
  }

  function renderFaqList() {
    const list = $('#admFaqList');
    if (!list) return;
    list.innerHTML = '';
    state.faqs.forEach(f => {
      const item = el('div', { class: 'adm-item' });
      const head = el('div', { class: 'adm-item__head' });
      head.innerHTML = `<b>${escapeHtml(f.q || 'New question')}</b>`;
      const delBtn = el('button', { type: 'button', class: 'adm-btn adm-btn--danger adm-btn--sm' });
      delBtn.innerHTML = '<svg class="ic" style="width:14px;height:14px"><use href="#i-trash"/></svg> Delete';
      delBtn.addEventListener('click', () => {
        state.faqs = state.faqs.filter(x => x.id !== f.id);
        renderFaqList();
        updatePreview();
      });
      head.appendChild(delBtn);
      item.appendChild(head);

      const qWrap = el('div', { class: 'adm-field' });
      qWrap.innerHTML = '<label>Question</label><input type="text">';
      qWrap.querySelector('input').value = f.q;
      qWrap.querySelector('input').addEventListener('input', e => { f.q = e.target.value; head.querySelector('b').textContent = e.target.value || 'New question'; updatePreview(); });
      item.appendChild(qWrap);

      const aWrap = el('div', { class: 'adm-field' });
      aWrap.innerHTML = '<label>Answer</label><textarea rows="3"></textarea>';
      aWrap.querySelector('textarea').value = f.a;
      aWrap.querySelector('textarea').addEventListener('input', e => { f.a = e.target.value; updatePreview(); });
      item.appendChild(aWrap);

      list.appendChild(item);
    });
  }

  function renderCatalogList(n, listEl) {
    const key = `cat-${n}`;
    const items = state.catalogs[key] || (state.catalogs[key] = []);
    listEl.innerHTML = '';
    items.forEach(item => {
      const row = el('div', { class: 'adm-item' });
      const head = el('div', { class: 'adm-item__head' });
      head.innerHTML = `<b>${escapeHtml(item.name || 'New item')}</b>`;
      const delBtn = el('button', { type: 'button', class: 'adm-btn adm-btn--danger adm-btn--sm' });
      delBtn.innerHTML = '<svg class="ic" style="width:14px;height:14px"><use href="#i-trash"/></svg> Delete';
      delBtn.addEventListener('click', () => {
        state.catalogs[key] = state.catalogs[key].filter(x => x.id !== item.id);
        renderCatalogList(n, listEl);
        updatePreview();
      });
      head.appendChild(delBtn);
      row.appendChild(head);

      const nameWrap = el('div', { class: 'adm-field' });
      nameWrap.innerHTML = '<label>Product / Breed Name</label><input type="text">';
      nameWrap.querySelector('input').value = item.name;
      nameWrap.querySelector('input').addEventListener('input', e => {
        item.name = e.target.value;
        head.querySelector('b').textContent = e.target.value || 'New item';
        updatePreview();
      });
      row.appendChild(nameWrap);

      const imgWrap = el('div', { class: 'adm-field' });
      imgWrap.innerHTML = '<label>Photo URL</label><input type="text">' +
        '<small class="adm-hint">Paste the path once you’ve uploaded the photo — e.g. assets/img/labrador-puppy.jpg. Leave blank to show a placeholder.</small>';
      imgWrap.querySelector('input').value = item.img || '';
      imgWrap.querySelector('input').addEventListener('input', e => { item.img = e.target.value; updatePreview(); });
      row.appendChild(imgWrap);

      const altWrap = el('div', { class: 'adm-field' });
      altWrap.innerHTML = '<label>Photo Alt Text</label><input type="text">';
      altWrap.querySelector('input').value = item.imgAlt || '';
      altWrap.querySelector('input').addEventListener('input', e => { item.imgAlt = e.target.value; updatePreview(); });
      row.appendChild(altWrap);

      const priceWrap = el('div', { class: 'adm-field' });
      priceWrap.innerHTML = '<label>Price</label><input type="text">' +
        '<small class="adm-hint">Optional — leave blank to hide the price, e.g. ₹8,000 or ₹450/kg</small>';
      priceWrap.querySelector('input').value = item.price || '';
      priceWrap.querySelector('input').addEventListener('input', e => { item.price = e.target.value; updatePreview(); });
      row.appendChild(priceWrap);

      const descWrap = el('div', { class: 'adm-field' });
      descWrap.innerHTML = '<label>Description</label><textarea rows="2"></textarea>';
      descWrap.querySelector('textarea').value = item.desc;
      descWrap.querySelector('textarea').addEventListener('input', e => { item.desc = e.target.value; updatePreview(); });
      row.appendChild(descWrap);

      const availWrap = el('div', { class: 'adm-field adm-field--checkbox' });
      const availId = 'cat_avail_' + item.id;
      availWrap.innerHTML = `<input type="checkbox" id="${availId}"${item.available !== false ? ' checked' : ''}><label for="${availId}">Currently in stock</label>`;
      availWrap.querySelector('input').addEventListener('change', e => { item.available = e.target.checked; updatePreview(); });
      row.appendChild(availWrap);

      listEl.appendChild(row);
    });
  }

  /* ---------------------------------------------------------
     INIT EDITOR once index.html has been loaded
     --------------------------------------------------------- */
  function initEditor() {
    const initialDoc = new DOMParser().parseFromString(state.rawIndexHtml, 'text/html');

    FIELDS.forEach(f => { state.values[f.key] = getFieldValue(initialDoc, f); });
    readBusinessFromDoc(initialDoc);
    readReviewsFromDoc(initialDoc);
    readFaqsFromDoc(initialDoc);
    readCatalogsFromDoc(initialDoc);

    const canonical = initialDoc.querySelector('link[rel="canonical"]');
    /* Read the domain the loaded file actually uses, and remember it as the
       search term for the replace. Guarded: a <link rel="canonical"> with no
       href would otherwise throw here and abort initEditor(), leaving the
       editor blank with no error shown. */
    var canonicalHref = canonical && canonical.getAttribute('href');
    state.site.domain = canonicalHref ? canonicalHref.replace(/\/$/, '') : DEFAULT_DOMAIN;
    state.site.origDomain = state.site.domain;

    const robotsEl = initialDoc.querySelector('[data-field~="meta-robots"]');
    state.site.robotsIndexable = !robotsEl || !/noindex/i.test(robotsEl.getAttribute('content') || '');

    if (state.rawMainJs) {
      const waMatch = state.rawMainJs.match(/var\s+WHATSAPP_NUMBER\s*=\s*'([^']*)'/);
      const nameMatch = state.rawMainJs.match(/var\s+SHOP_NAME\s*=\s*'([^']*)'/);
      state.origMainJs.whatsapp = waMatch ? waMatch[1] : '';
      state.origMainJs.shopName = nameMatch ? nameMatch[1] : '';
      state.site.shopName = state.origMainJs.shopName || state.site.shopName;
      if (!state.business.whatsapp && state.origMainJs.whatsapp) state.business.whatsapp = digits10(state.origMainJs.whatsapp);
    }

    $('#admEditorArea').hidden = false;
    $('#admActionBar').hidden = false;
    renderAllSections();
    updatePreview();
  }

  /* ---------------------------------------------------------
     SAVE & DOWNLOAD
     --------------------------------------------------------- */
  function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function doSave() {
    const doc = buildDocument();
    const outHtml = serializeDoc(doc);
    const downloaded = [];

    download('index.html', outHtml, 'text/html;charset=utf-8');
    downloaded.push('index.html');

    // main.js — only regenerate if it was uploaded AND something it controls changed
    if (state.rawMainJs) {
      const newWa = '91' + digits10(state.business.whatsapp);
      const nameChanged = state.site.shopName.trim() !== state.origMainJs.shopName.trim();
      const waChanged = newWa !== state.origMainJs.whatsapp;
      if (nameChanged || waChanged) {
        let js = state.rawMainJs;
        js = js.replace(/(var\s+WHATSAPP_NUMBER\s*=\s*')[^']*(')/, `$1${newWa}$2`);
        /* Escape before injecting into a single-quoted JS string literal, and
           use a replacer FUNCTION so $&, $` and $' in the name aren't treated
           as replacement patterns. An unescaped apostrophe here ("Vinny's Pet
           Shop") would write a syntax error into main.js, killing the whole
           IIFE — and since .reveal starts at opacity:0 and only JS adds
           .is-in, most of the page would render blank. */
        const safeName = state.site.shopName.trim().replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        js = js.replace(/(var\s+SHOP_NAME\s*=\s*')[^']*(')/, (m, a, b) => a + safeName + b);
        download('main.js', js, 'text/javascript;charset=utf-8');
        downloaded.push('assets/js/main.js');
      }
    }

    // robots.txt / sitemap.xml / 404.html — only if domain changed AND they were uploaded
    const newDomain = normDomain();
    const domainChanged = newDomain && newDomain !== state.site.origDomain;
    if (domainChanged) {
      if (state.rawRobots) { download('robots.txt', state.rawRobots.split(state.site.origDomain).join(newDomain), 'text/plain;charset=utf-8'); downloaded.push('robots.txt'); }
      if (state.rawSitemap) { download('sitemap.xml', state.rawSitemap.split(state.site.origDomain).join(newDomain), 'application/xml;charset=utf-8'); downloaded.push('sitemap.xml'); }
      if (state.raw404) { download('404.html', state.raw404.split(state.site.origDomain).join(newDomain), 'text/html;charset=utf-8'); downloaded.push('404.html'); }
    }

    const dl = $('#admDownloads');
    const dlList = $('#admDownloadsList');
    dlList.innerHTML = downloaded.map(f => `<li>${escapeHtml(f)}</li>`).join('');
    dl.hidden = false;
    $('#admPublish').hidden = false;
    $('#admSaveStatus').textContent = `Downloaded ${downloaded.length} file(s) just now.`;
  }

  /* ---------------------------------------------------------
     PASSPHRASE GATE
     --------------------------------------------------------- */
  async function sha256Hex(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function initGate() {
    const dialog = $('#admGate');
    const form = $('#admGateForm');
    const passInput = $('#admGatePass');
    const err = $('#admGateErr');

    if (typeof dialog.showModal === 'function') {
      dialog.addEventListener('cancel', e => e.preventDefault()); // no Escape-bypass
      dialog.showModal();
    } else {
      dialog.setAttribute('open', ''); // very old browser fallback
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();
      err.textContent = '';
      let hash;
      try {
        hash = await sha256Hex(passInput.value);
      } catch (cryptoErr) {
        err.textContent = 'This browser will not run crypto.subtle here — try a normal (non-private) window, or a modern browser.';
        return;
      }
      if (hash === ADMIN_PASS_HASH) {
        if (typeof dialog.close === 'function') dialog.close();
        dialog.hidden = true;
        $('#admShell').classList.add('is-active');
      } else {
        err.textContent = 'Wrong passphrase. Try again.';
        passInput.value = '';
        passInput.focus();
      }
    });
  }

  /* ---------------------------------------------------------
     BOOT
     --------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initGate();
    $('#admFileInput').addEventListener('change', e => { handleFiles(e.target.files); });
    $('#admSaveBtn').addEventListener('click', doSave);
  });
})();
