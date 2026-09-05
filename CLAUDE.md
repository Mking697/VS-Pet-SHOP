# CLAUDE.md — V S Pet Shop Website

Project context for Claude Code. Read this first in any new session.

---

## 1. What this project is

A **static landing-page website** for a real pet shop in Greater Noida, deployed to
**Hostinger shared hosting**. Pure HTML + CSS + vanilla JavaScript.

**Hard constraints — do not break these:**

- **No build step.** No npm, no bundler, no framework. Files must run by opening
  `index.html` directly. Hostinger shared hosting serves static files only.
- **No backend.** No PHP, no Node, no database. Forms must work client-side
  (currently: the enquiry form builds a `wa.me` deep link).
- **No React/shadcn components.** 21st.dev MCP components are React-based and cannot
  be dropped in. If a 21st.dev pattern is wanted, reimplement it in vanilla CSS/JS.
- **Mobile-first.** Most visitors are on phones. Test 375px before anything else.

---

## 2. Real business data (verified)

Pulled from the Google Business Profile and Instagram bio. **This is real — never
replace it with placeholder or invented data.**

| Field | Value |
|---|---|
| Domain | vspetshop.com (registered on GoDaddy, hosted/deployed on Hostinger — see §9) |
| Name | V S Pet Shop |
| Address | Shop No. 39, Habitech Panchtatva, near Galaxy Vega, Tech Zone IV, Amrapali Dream Valley, Greater Noida, Uttar Pradesh 201318 |
| Phone / WhatsApp | +91 88512 03070 (`918851203070`) |
| Email | vspetshop2007@gmail.com |
| Hours | **Open 24 hours, all 7 days** |
| Google rating | 5.0 from 18 reviews |
| GMB / directions link | https://share.google/t2MvFYX8s03WqXF8s |
| Instagram | https://www.instagram.com/vspetshop/ |
| Facebook | https://www.facebook.com/profile.php?id=61591726734548 |
| YouTube | **Not provided yet** — placeholder is in the DOM, `hidden` |
| Sells | Dogs, cats, birds · food · toys · accessories · grooming services · home delivery |
| Tagline (their own) | "Where every pet feels at home" |

### Still unknown / needs the owner

- ~~**Domain name**~~ — resolved: `vspetshop.com`. Canonical link, OG tags, JSON-LD
  `url`/`image`, `robots.txt`, and `sitemap.xml` all point there now (no `www`,
  redirected to non-www at the `.htaccess` level — see §9).
- **YouTube channel URL.**
- Whether they want prices shown anywhere.

---

## 3. File map

```
VS Pet Shop/
├── index.html          Single landing page — all sections
├── 404.html            Custom not-found page
├── CLAUDE.md           ← this file
├── README.md           Owner-facing deploy + edit guide
├── favicon.svg         Paw mark
├── .htaccess           HTTPS force, gzip, cache headers, security headers, 404,
│                       denies public access to CLAUDE.md/README.md/.gitignore
│                       (the repo deploys as-is via Hostinger's Git integration,
│                       so anything tracked in git lands in the web root)
├── robots.txt          Disallows /admin/ (see §9)
├── sitemap.xml
├── admin/              Client-side "admin panel" for content editing — no
│   │                   backend, edits a locally-selected copy of index.html
│   │                   and hands back downloads to manually re-upload.
│   │                   See §9 for why it works this way. noindex/nofollow.
│   ├── index.html      Passphrase-gated form UI + live preview iframe
│   └── assets/
│       ├── css/admin.css  adm-prefixed styles, reuses the live site's
│       │                  CSS tokens from assets/css/style.css
│       └── js/admin.js    All admin logic. Passphrase hash + how to
│                          change it documented at the top of the file.
└── assets/
    ├── css/style.css   All styling. Design tokens in §1 at the top.
    ├── js/main.js      All behaviour. Config constants at the top (line ~11).
    └── img/            EMPTY — real shop photos go here
```

### Where things live

- **Colours, radii, shadows, spacing, container width** → CSS `:root` block, §1.
- **Phone / WhatsApp number used by the form** → `main.js` `WHATSAPP_NUMBER`.
- **Icons** → inline SVG `<symbol>` sprite at the top of `index.html` `<body>`.
  27 symbols, all `#i-*`. Add new icons there, reference with `<use href="#i-name"/>`.
  Stroke icons inherit `.ic` styling; solid glyphs declare `fill`/`stroke` on the symbol.
- **CSS section numbering** — the stylesheet is numbered §1–§23. Responsive rules are
  all in §22, ordered widest-first then narrowest. Keep new rules in their section.
- **`data-field="..."` attributes in `index.html`** → purely additive markup (no visual
  or behavioural effect — `main.js` never selects on them) that lets `admin/assets/js/admin.js`
  find and update the right element without depending on line numbers or DOM order. See §9.
  If you add new editable content to the page by hand, it will not show up in the admin
  panel unless you also tag it with a `data-field` and add a matching field definition in
  `admin/assets/js/admin.js` — that's expected, not a bug.
- **Category catalog items** → each `<article class="cat cat--COLOR">` carries a
  `<template class="cat__catalog" data-catalog-for="cat-N">` holding that category's
  catalog items — real product cards (`.catmodal__item`, each with its own
  `cat-N-catalog-M` / `-name` / `-desc` / `-img-src` / `-img-alt` / `-price` / `-avail`
  `data-field`s — photo via the shared `.ph` frame, optional price, in-stock/unavailable
  badge). The shared popup markup (`#catModal`) sits right after `#lightbox` near the
  end of `<body>`; its CSS is the unnumbered "CATALOG MODAL" block right after §20
  Lightbox in `style.css`. See main.js module 17 (§5 below) and §7 Done.

---

## 4. Design system

Generated via the `ui-ux-pro-max` skill (Claymorphism direction for a playful retail brand).

- **Style:** Claymorphism — soft double shadows (outer + inset highlight), chunky
  radii (18–34px), tinted pastel card surfaces, no hard lines.
- **Palette:** `--brand #F97316` (orange) · `--accent #2563EB` (trust blue, focus rings)
  · `--bg #FFF7ED` (warm cream) · `--dark #241608` (footer, dark panels)
  · WhatsApp green `#25D366` / `#128C4A`.
- **Type:** Rubik (headings, 500–800) + Nunito Sans (body, 400–700), Google Fonts.
- **Motion tier:** Standard. 150–300ms micro-interactions, `cubic-bezier(.22,1,.36,1)`,
  70ms stagger between grid children. All of it inside a `prefers-reduced-motion` guard.

### Layout widths

The container is deliberately fluid so large monitors don't show a narrow column:

| Viewport | `--wrap` |
|---|---|
| default | 1440px |
| ≥1500px | 1560px, body font 18px |
| ≥1800px | `min(90vw, 1900px)` |

Breakpoints: 1800 / 1500 / 1080 / 900 / 640.
The mobile nav drawer and sticky bottom bar switch on at 900px and 640px.

---

## 5. Page structure (index.html)

topbar → sticky header + mobile drawer → **hero** (staggered entrance, photo collage,
floating badge + Google rating card) → feature strip → **6 category cards** (Dogs, Cats,
Birds, Pet Food, Grooming, Accessories) → tilted marquee ribbon → **6 services** →
**why-us grid + animated counters** → **gallery** (6 photos, lightbox) →
**reviews** (2-row marquee, real Google reviews) → **FAQ** (7 items, accordion) →
**contact** (details + WhatsApp form + map) → CTA band → footer →
floating WhatsApp FAB + back-to-top + mobile Call/WhatsApp/Directions bar.

### JS modules in main.js (numbered 1–20)

year · sticky header · nav drawer · scroll-spy active link · reveal+stagger observer ·
counters · marquee init (clones the set, computes duration from width) · lightbox ·
FAQ single-open · form→WhatsApp · back-to-top · one throttled scroll listener ·
Escape closes overlays · broken-image fallback · marquee re-measure on resize ·
**live pet photos** (§16 — every `.ph` photo frame tilts toward the cursor via
`--tiltX/--tiltY/--tiltZ` custom properties set on `mousemove`, rAF-throttled, plus a
paw-print (`.paw-trail`, reuses the `#i-paw` sprite symbol) trails the cursor while
hovering one. Gated behind `matchMedia('(hover: hover) and (pointer: fine)')` so touch
devices never trigger it, and behind `reduceMotion` so it never runs at all under
`prefers-reduced-motion` — this was a 21st.dev-style "component" request; reimplemented
in vanilla CSS/JS per the hard constraint in §1, no framework involved) ·
**catalog modal** (§17 — each of the 6 category cards has a "View Catalog" button
(`[data-catalog-trigger="cat-N"]`) that clones that category's
`<template class="cat__catalog" data-catalog-for="cat-N">` into the shared `#catModal`
popup. Title/lead are read live off that card's own `.cat__title` / `.cat__body p` so
an admin-panel edit to either can't drift out of sync with the modal. Open/close
mechanics are a direct copy of the §8 lightbox — `hidden` attribute + `.is-open` class,
body scroll lock, focus moved to the close button on open and back to the trigger on
close. Escape closes it via the existing §13 handler, extended rather than duplicated) ·
**category favourites** (§18 — a heart-toggle `[data-fav="cat-N"]` button on each
category card; state is a plain array in `localStorage['vspetshop:favorites']`, all
access wrapped in try/catch, restored on load) · **paw-burst** (§19 — a
`pawBurst(originEl)` helper called from §10 right after the WhatsApp deep link opens;
spawns 6–8 one-shot `.paw-trail`-style paw elements from the submit button) ·
**pet-care tip strip** (§20 — rotates `#tipStripText` through a fixed array of generic
pet-care facts every 5.5s with a crossfade, paused on hover/focus, static on the first
tip under `prefers-reduced-motion`).

---

## 6. Content integrity rules

**This is a real business. Do not invent facts about it.**

- The 7 testimonials in the reviews section are **verbatim real Google reviews**
  (Sachin Thakur, Sakshi Kumari, Kartik Dutt Sharma, Jitendra Jadoun, Gaurav Sharma,
  Himansshu Sharma, Abhishek Kumar). Do not edit their wording or add fabricated ones.
- Stats are limited to verifiable numbers: 5.0 rating, 18 reviews, 24/7, 3 pet types.
  An earlier draft had "5,000+ happy families" and "12 years experience" — both invented,
  both removed. Do not reintroduce that kind of claim without the owner confirming it.
- **`aggregateRating` was deliberately removed from the JSON-LD.** Google's structured
  data guidelines prohibit marking up third-party (Google) review scores as your own
  site's rating. The 5.0 is shown visually and links to the GMB listing instead — that's
  the compliant way. Do not add it back.

---

## 7. Status

### Done

- [x] Full landing page, all sections, responsive 375 → 1920+
- [x] Claymorphism design system + tokens
- [x] Motion: hero stagger, scroll reveal, counters, two marquees, hover states
- [x] Accessibility: skip link, focus rings, ARIA labels, keyboard nav, reduced-motion
- [x] SEO: local-intent title/description, LocalBusiness (PetStore) JSON-LD, full OG +
      Twitter Card tags (title/description/site_name/locale), explicit `robots` meta,
      sitemap, robots.txt
- [x] Real contact details, address, hours, social links wired in
- [x] Real Google reviews replacing sample testimonials
- [x] Birds + Grooming added as categories (confirmed from Instagram bio and reviews)
- [x] Hostinger `.htaccess`, custom 404
- [x] Fixed: floating hero cards were painting behind the hero photo
      (`.ph > img` sits at `z-index:1`, so the floats need `z-index:3`)
- [x] Fixed: **nothing on the page was clickable.** `.lb`, `.fab` and `.soc` set
      `display` in the author stylesheet, which beats the UA `[hidden]{display:none}`
      rule. The lightbox therefore stayed in the layout — `position:fixed; inset:0;
      z-index:200; opacity:0` — as an invisible sheet over the whole page eating every
      click. Guard added at CSS §2: `[hidden]{ display:none !important; }`.
      **Any new component that sets `display` and relies on the `hidden` attribute
      depends on this rule — do not remove it.**
- [x] Asset URLs carry `?v=N`. `.htaccess` caches CSS/JS for a year, so **bump that
      number whenever style.css or main.js changes**, or returning visitors keep the
      stale file. Currently: `main.js?v=6` (bumped from v=5 — added modules 18–20, see
      the delight-pass entries below), `style.css?v=7` (bumped from v=6 for the same
      pass — index.html and 404.html both reference the same style.css version).
- [x] **`admin/` client-side content panel** — see §9. Tags almost every editable
      string, image URL and link on the page with a `data-field` attribute, parses a
      locally-selected copy of `index.html` (+ optionally `main.js`, `robots.txt`,
      `sitemap.xml`, `404.html`) with `DOMParser`, offers a form UI with a live
      preview, and downloads edited files for manual re-upload. Passphrase-gated
      (not real security — see §9). `assets/css/style.css` and the shipped
      `assets/js/main.js` were **not** modified by this work — no `?v=` bump needed.
- [x] **SEO meta tags + admin SEO tab.** Added an explicit `robots` meta tag,
      `og:site_name`, `og:locale`, and completed the Twitter Card set (`twitter:title`,
      `twitter:description` — previously only `twitter:card` existed, so previews on
      Twitter/X had no fallback of their own). `admin/` has a dedicated **SEO** section:
      social-share title/description (drives `og:title`/`og:description` *and*
      `twitter:title`/`twitter:description` together, one field each — they share a
      `data-field` key so they can't drift out of sync), and an "Allow search engines to
      index this site" checkbox that writes `noindex, nofollow` when off (useful while
      the site is still using placeholder photos/domain). The JSON-LD block is now also
      kept in sync automatically whenever Business Info changes: `telephone`, `email`,
      `hasMap`, and `sameAs` (Instagram/Facebook/YouTube) are rewritten from the same
      admin fields already used for the visible contact links — **except** the postal
      `address` sub-fields, which are not auto-derived from the free-text "Full Address"
      field (splitting that back into streetAddress/locality/region/postalCode reliably
      isn't possible from plain text) — edit the JSON-LD block in `index.html` by hand
      if the shop address ever changes.
- [x] **Live pet photos on hover** — see JS module §16 above. The user asked to "use
      the 21st.dev MCP server" for this; that MCP wasn't connected in this session, and
      even if it were, its components are React-based and can't be dropped into a
      no-framework static site (§1 hard constraint) — so the interaction pattern was
      reimplemented from scratch in vanilla CSS custom properties + JS, same result,
      zero framework weight.
- [x] **Per-species hover motion** (CSS §9, `@keyframes trotDog / roamCat / flutterBird`)
      — the user then asked for the dog to run/wag its tail, the cat to roam, the
      parrot to flap its wings on hover. These are flat photographs (currently Unsplash
      placeholders, pending the real shop photos above) — there is no rig, no separate
      limb/wing layer, so nothing can literally run or flap frame-by-frame without real
      video/frame source assets, which don't exist for this shop. What's built instead:
      each `.cat--amber` (Dogs) / `.cat--violet` (Cats) / `.cat--sky` (Birds) card's
      photo gets a distinct whole-image motion signature on hover — a bouncy trot, a
      slow prowling drift, a fast wing-flutter shake respectively — that reads as that
      behaviour. The hero photo (also a dog) reuses `trotDog`. Every keyframe re-states
      `perspective()/rotateX()/rotateY()/scale()` from the §16 tilt custom properties
      so the cursor-tilt and the species motion compose instead of one overwriting the
      other. Neutralised by the existing global `prefers-reduced-motion` rule in §23
      (no separate override needed — animation-duration already collapses to `.01ms`
      there). Pure CSS, no new JS, no new assets.
- [x] **Category catalogs + "View Catalog" popup.** The owner wanted each of the 6
      category cards to open a browsable catalog. New markup: a `<template
      class="cat__catalog" data-catalog-for="cat-N">` inside each `.cat` article holding
      its `.catmodal__item`s, a "View Catalog" button in each card's `.cat__body`
      (`[data-catalog-trigger="cat-N"]`, alongside the existing Enquire/Book-a-Slot
      button, not replacing it), and a shared `#catModal` popup after `#lightbox`,
      styled in the unnumbered "CATALOG MODAL" CSS block right after §20 Lightbox
      (same `hidden`/`.is-open` pattern, reuses `--z-lb`). New JS: main.js module 17 —
      clones the clicked category's template into the modal, reads that category's
      title/description live off the DOM (never duplicated, so it can't drift out of
      sync with an admin-panel edit), and builds a prefilled `wa.me` link using the
      existing `WHATSAPP_NUMBER` constant. Escape closes it via the existing §13
      handler (extended, not duplicated). Initially (previous session) each item was a
      generic icon+name+desc placeholder decomposed from the category's own approved
      copy, with no real product data — see the upgrade below.
- [x] **Catalog items upgraded to real product cards (photo / optional price / stock
      status).** The owner has real breed-wise stock, so each `.catmodal__item` is now
      a product card: `<figure class="ph catmodal__item-img"><img ...></figure>` (reuses
      the site's existing `.ph` graceful photo-frame — empty/broken `src` shows the
      warm-gradient-and-paw-print fallback everywhere else on the site already uses, no
      separate "no photo" state was built), a name/price row (`h4` name doubles as the
      breed/product name — no separate breed field), an **optional free-text price**
      (`<span class="catmodal__item-price" data-field="cat-N-catalog-M-price" hidden>` —
      rendered only when non-empty; this is the practical resolution of §2's previously
      open "should prices be shown" question — it's now a per-product owner choice, not
      a site-wide one), the existing description `<p>`, and an in-stock/unavailable pill
      (`<span class="catmodal__item-badge is-avail|is-unavail" data-field="cat-N-catalog-M-avail">`,
      "In Stock" / "Currently Unavailable", defaults to in-stock). The per-item icon
      (`.catmodal__item-ic`) was removed — photos replace it as the primary visual — and
      its now-orphaned tint CSS rules were deleted along with it (confirmed via grep
      that nothing else referenced them). The photo's `<img>` carries two space-separated
      `data-field` keys on one element (`cat-N-catalog-M-img-src cat-N-catalog-M-img-alt`),
      matching the same convention already used for the category cards' own images. The
      19 items seeded in the previous session kept their original name/desc text
      unchanged — only the markup was restructured — and now start with an empty photo
      (shows the fallback) and no price (hidden) until the owner fills in real photos/
      prices from `admin/`.
      **Cursor-tilt inside the modal:** main.js module 16 binds its tilt/paw-trail
      listeners once, at page load, to whatever `.ph` elements exist at that moment.
      The catalog modal's product-photo `.ph` frames don't exist then — they're cloned
      from each category's `<template>` only when "View Catalog" is clicked, strictly
      after that one-time binding pass — so they never receive the tilt effect and stay
      static, by construction, with zero code changes needed either way. This was
      judged a fine, low-risk choice for a small product-grid popup (not the hero/
      category showcase) and left as-is; documented in a CSS comment right above
      `.catmodal` in `style.css` so a future session doesn't mistake it for a bug.
      main.js module 14 (broken-image fallback) got the opposite treatment: its
      per-image bind logic was extracted into a named `bindBrokenImageFallback(img)`
      function and is explicitly re-run on the modal's cloned photos from `openCatalog()`
      in module 17 — that one affects the default "no photo yet" appearance for every
      seeded item, so it couldn't be skipped the same way tilt was. This was the only
      reason main.js needed a version bump this session.
      **The owner can manage all of this themselves** from `admin/` — each of the 6
      category cards' nested "Catalog items" list now offers Product/Breed Name, Photo
      URL (with a hint pointing at `assets/img/...`), Photo Alt Text, Price (optional,
      with a hint), Description, and a "Currently in stock" checkbox — same
      state → `readCatalogsFromDoc`/`buildCatalogItemEl`/`applyCatalogsToDoc` →
      `buildDocument()` pipeline already used for Reviews and FAQ, and the same inline
      per-item mini-form construction style those two lists already use. The item data
      model is `{ id, name, desc, img, imgAlt, price, available }`.
- [x] **Delight/polish pass** — requested as "use the `ui-ux-pro-max` skill and make
      the site more attractive to pet lovers." That skill wasn't available this
      session; the Claymorphism direction already documented in §4 was extended by
      hand instead, purely additive on top of every existing component (nothing in
      §16/§17 or any other prior work was touched). Four pieces:
      - **Ambient paw-print texture on `.section--alt`** (CSS §3, where `.section--alt`
        is defined) — the same paw-print visual language as the §5 `.ph::after` photo-
        frame watermark, reused as a tiled `background-image` (not an overlay element,
        so no z-index/click-interception risk) at 5% opacity on `--brand-700` instead
        of the watermark's 35% white, because this sits on plain warm cream rather than
        the photo-frame's warm gradient and needed to be far fainter to read as texture
        rather than pattern. Static — nothing to guard under reduced-motion. Currently
        affects Services, Gallery and FAQ (the three `.section--alt` sections).
      - **Category favourites** — a `.cat__fav` heart-toggle button, top-right corner of
        each of the 6 category cards (CSS appended into §9; the top-right corner was
        chosen because `.cat__img` only bleeds into the *bottom*-right, and the existing
        Enquire/Book-a-Slot + View Catalog buttons live in `.cat__body`, so there's no
        overlap). Real `<button aria-pressed>` with an `aria-label` that's rebuilt from
        the card's live `.cat__title` text on every toggle (so it can never drift out of
        sync with an admin-panel rename), pop-bounce animation on toggle using
        `calc(var(--t-fast) + var(--t-base))` and `var(--e-out)` — the site's existing
        motion tokens, not an invented duration. State is main.js §18: one array in
        `localStorage['vspetshop:favorites']` (e.g. `["cat-1","cat-3"]`), all reads/
        writes wrapped in try/catch so a storage failure (private browsing, storage
        blocked) never breaks the page — favourites just don't persist that session.
        First use of `localStorage` in this project. Pure per-visitor convenience, not
        admin-editable, no `data-field` involved.
      - **Paw-burst on successful WhatsApp submit** — main.js §19's `pawBurst(originEl)`,
        called from the existing §10 submit handler right after the WhatsApp deep link
        opens (one line added; validation/`form.reset()`/everything else in §10 is
        untouched). Spawns 6–8 `.paw-trail`-style one-shot paw elements (CSS: unnumbered
        "FORM PAW-BURST" block next to `.paw-trail`) that pop outward from the submit
        button and self-remove on `animationend` — the exact same idiom the existing
        cursor paw-trail (§16) already uses, deliberately not a new mechanism. Skipped
        entirely when `reduceMotion` is true (the existing `#formNote` text already
        covers that case).
      - **Rotating pet-care tip strip** — a new slim claymorphism strip between Reviews
        and FAQ (`<section class="tip-strip">`, unnumbered "PET CARE TIP STRIP" CSS
        block placed next to §15 FAQ). main.js §20 rotates six **generic, well-
        established pet-care facts** (not claims about this shop — §6 is about the
        latter, this is deliberately a different, safe category) every 5.5s with an
        opacity crossfade, paused on hover/focus via `mouseenter/leave` +
        `focusin/out`. Under `prefers-reduced-motion` no `setInterval` is ever started —
        the first tip just shows, permanently, statically.

### Blocked on the owner

- [ ] **Real shop photos** — the page currently uses 12 Unsplash demo images.
      Their GMB has real interior photos; those should replace the demos.
      Put them in `assets/img/`, resize ≤1200px, convert to WebP, ≤200 KB each.
- [ ] **`og-cover.jpg`** (1200×630) for WhatsApp/Facebook link previews — does not exist yet.
- [ ] **Real domain** — replace every `www.vspetshop.in`. The owner can now do this
      themselves from `admin/` (Site Settings → Domain) once the domain is known —
      still blocked only on *knowing* the domain, not on someone editing HTML by hand.
- [ ] **YouTube URL** — then remove the `hidden` attribute on the two `.soc--yt` links.
      Also now doable from `admin/` (Business Info → YouTube Channel URL + the
      "Show YouTube link" checkbox) once the owner has the channel URL.

- [x] **Page-speed pass** (after go-live, Hostinger's Page Speed tool showed Desktop 94 /
      Mobile 78). No build step means no minifier/bundler to lean on, so every fix here
      is plain markup/attribute changes:
      - **Fonts trimmed + made non-render-blocking.** The Google Fonts request asked for
        weight 500 on both Nunito Sans and Rubik; grepping `style.css` turned up zero
        uses of either (body text relies on the browser's implicit 400, unstyled
        headings fall back to the UA "bold" keyword which resolves to 700, already
        requested) — dropped both, so it's 6 font files instead of 8. The stylesheet
        `<link>` itself was also swapped for the standard `media="print"
        onload="this.media='all'"` trick (+ a `<noscript>` fallback and a
        `rel="preload" as="style"` so the browser still fetches it early) so it no
        longer blocks first paint while it downloads.
      - **Hero photo preloaded + made responsive.** It's the LCP element on this page.
        Added `<link rel="preload" as="image" fetchpriority="high" imagesrcset=...
        imagesizes=...>` in `<head>` so the browser starts fetching it before it even
        reaches the `<body>`, and gave the `<img>` itself a matching `srcset`/`sizes`
        (480w for the ≤900px stacked-hero layout, 900w above that) — phones no longer
        download the same 900px-wide source a desktop does. `imagesrcset`/`imagesizes`
        on the preload tag must stay in sync with the `<img>`'s own `srcset`/`sizes` or
        the browser can preload the wrong variant and fetch the image twice.
      - **Fixed a lazy-loading anti-pattern.** The floating kitten photo (`.ph--float`)
        sits inside the hero, visible immediately on load, but had `loading="lazy"` on
        it — lazy-loading is for below-the-fold images; on an above-the-fold one it can
        delay it and is a common Lighthouse flag. Removed.
      - **Not done, deliberately:** no `srcset` was added to the 6 category cards or 6
        gallery photos — they already carry `loading="lazy"` and sit below the fold, so
        they don't affect LCP/the initial critical path the way the hero does; the
        payoff for the added markup complexity is much smaller there. Revisit once the
        Unsplash placeholders are replaced with the real, self-hosted shop photos
        anyway (see "Blocked on the owner" above) — that's the point where `<picture>`/
        `srcset` sizing should be redone against the real asset dimensions, not before.

### Possible next steps (not started)

- Product/pricing section if the owner wants prices public
- Separate pages (About, Services detail) — currently one page with anchor nav
- Google Analytics / Search Console verification
- Real Google Reviews widget instead of hard-coded quotes (needs an API key or a
  third-party embed; hard-coded is faster and has zero third-party JS)

---

## 8. Local preview

```bash
python -m http.server 8000   # then http://127.0.0.1:8000
```

Sanity checks after edits:

```bash
node --check assets/js/main.js
# every #i-* reference must have a matching <symbol id="...">
comm -23 <(grep -o 'href="#i-[a-z-]*"' index.html | sed 's/href="#//;s/"//' | sort -u) \
         <(grep -o 'symbol id="i-[a-z-]*"' index.html | sed 's/symbol id="//;s/"//' | sort -u)
```

The CSS linter in this workspace warns about physical properties
(`width` vs `inline-size`). Those warnings are cosmetic — ignore them.

Also check `admin.js` still parses and still has no `fetch()` calls:

```bash
node --check admin/assets/js/admin.js
grep -n "fetch(" admin/assets/js/admin.js   # should match nothing except comments
```

---

## 9. Admin panel (`admin/`) — why it works the way it does

**The constraint tension.** §1's hard constraints rule out a backend entirely (no PHP,
no Node, no database). A normal admin panel needs somewhere to write changes to and a
server to serve them from — this site has neither, and adding either would break
"opens by double-clicking `index.html`" and "runs on Hostinger shared static hosting."
So a *live*, persistent, click-and-it's-published admin panel is not possible here
without violating §1. That was true before this feature and is still true after it —
this section exists so a future session doesn't try to "fix" that by reaching for a
database or a serverless function.

**The chosen design.** `admin/index.html` is a second, separate static page. The owner
opens it (by double-click, same as the main site) and uses `<input type="file" multiple>`
to hand it their local `index.html` (required) and optionally `main.js`, `robots.txt`,
`sitemap.xml`, `404.html`. Everything after that happens **in browser memory only**:

1. Files are read with `FileReader` — never `fetch()`, which can't reliably read local
   files from a `file://` page in Chrome.
2. `index.html`'s text is parsed into an in-memory `Document` with `DOMParser`.
3. Every editable spot in `index.html` carries a stable `data-field="..."` attribute
   (added across the whole page for this feature — see §3's file map entry and the
   "Where things live" bullet above). `admin.js` finds elements by that attribute, not
   by line number or DOM position, so re-ordering sections later won't silently break it.
4. The owner edits plain form fields; a live `<iframe srcdoc>` preview re-renders the
   in-memory document (debounced) so they see the result before committing to anything.
5. "Save & Download" re-serializes the edited `Document` (`'<!DOCTYPE html>\n' +
   doc.documentElement.outerHTML`) into a `Blob` and downloads it as `index.html` via a
   temporary `<a download>`. If the phone/WhatsApp number or shop name changed and
   `main.js` was also uploaded, an updated `main.js` is offered too — only its two
   `WHATSAPP_NUMBER` / `SHOP_NAME` lines change, everything else stays byte-identical
   (targeted regex replace, not a rewrite). If the domain changed, the same literal
   string replace is applied to `robots.txt` / `sitemap.xml` / `404.html` if they were
   also uploaded, and offered as extra downloads.
6. **The owner still has to upload those downloaded files to Hostinger themselves**
   (File Manager or FTP) — the tool says so in a permanent on-screen box after saving.
   Nothing is "published" by this tool. That's the deliberate trade-off: no backend
   means no live editing, so the tool edits a *local copy* and hands back a *file* —
   the human is the last step in the loop, same as any manual edit would require.

**Passphrase gate.** `admin/index.html` sits behind a passphrase prompt implemented in
`admin/assets/js/admin.js` (a `<dialog>`, SHA-256 hash comparison via `crypto.subtle`).
How to change it is documented in a comment at the top of `admin/assets/js/admin.js` —
**the plaintext passphrase itself is deliberately never written in that file, or
anywhere else in this repo.** This repo is public on GitHub, so a comment is not a
private note — it's a public one. The actual current passphrase was shared with the
shop owner out of band (WhatsApp) only. If you ever regenerate it, do the same: give
the new hash to the file, give the new plaintext to the owner directly, never both to
the repo. **This is still only a client-side speed bump, not authentication** — even
with the plaintext removed, anyone who can view-source the page can read the hash and
brute-force a weak passphrase, or simply see that a gate exists. It does not protect
anything sensitive and must never be treated as real access control. Consequently:
`admin/index.html` carries `<meta name="robots" content="noindex, nofollow">`,
`robots.txt` disallows `/admin/`, and the UI itself shows a permanent on-screen warning
saying not to share the admin link publicly. Don't remove any of those three and don't
let anyone mistake this gate for real security.

**Domain & hosting.** The live domain is `vspetshop.com` (registered on GoDaddy, no
`www`) — this is a *different* company from the host, so DNS has to point from one to
the other; there's nothing to "connect" inside a single dashboard. Hostinger's Git
integration is connected to this GitHub repo (`Mking697/VS-Pet-SHOP`, branch `main`) and
deploys pushed commits into the site's document root — so `git push` is effectively the
publish step for everything except the DNS pointing itself, which is a one-time GoDaddy
change (nameservers to Hostinger's, or an A record to Hostinger's IP — done outside git
entirely, in each provider's own dashboard). `.htaccess` forces HTTPS and redirects
`www.vspetshop.com` → `vspetshop.com` to match the non-www canonical URL used
everywhere in `index.html`/`robots.txt`/`sitemap.xml`. Because the whole repo deploys
as-is (see the `.htaccess` file-map entry in §3), `CLAUDE.md`/`README.md`/`.gitignore`
are denied at the web-server level even though they physically sit in the deployed
folder — see the passphrase-gate paragraph above for the same reasoning applied to why
`admin/` stays gated instead of just "not uploaded."

---

## 10. Audit round (Sep 2026) — bugs found once the site was finally looked at

Until this round every "verification" on this project was code-level: `node --check`,
grep, `curl` status codes. **Nothing had ever been opened in a browser.** A human
looking at it on a phone found two broken layouts in minutes. A Playwright pass and
three read-only audits (accessibility, SEO, code review) then found a lot more. The
lesson worth carrying forward: *for anything visual, code-level checks prove nothing.*

### The CSS containment/stacking traps — four of them, same family

These are the ones most likely to be re-introduced, so they're documented in full at
their site in `style.css`. Do not undo any of them:

1. **`overflow-x:hidden` belongs on `html` ONLY, never also on `body`** (§2). The
   viewport takes its overflow from the root; body's is propagated *only* while the
   root computes to `visible`. With both set, body becomes a scroll container and
   `position:sticky` (`.header` §7, `.stats` §12) silently stops working — measured:
   header top at scroll 1200 was `-1159` (scrolled away) with both, `0` (pinned) with
   only `html`. It needs to be on `html` rather than `body` because body's version does
   not clip `position:fixed` descendants, which is what inflated the mobile layout
   viewport to ~1600px and squeezed the whole page into a narrow column.
2. **`.rev` needs `overflow:hidden`** (§14), like its sibling `.ribbon` (§10) — both
   wrap a `width:max-content` marquee track that otherwise escapes.
3. **`backdrop-filter` must not sit on `.header`** (§7) — it makes the element a
   *containing block for `position:fixed` descendants*, so the nav drawer anchored to
   the 75px header bar and rendered as a 340×110 stub instead of a full-height panel.
   The glass lives on `.header::before` now; pixel-diffed at 0 differing pixels.
4. **`#navScrim` must stay inside `<header>`**, as a sibling of `.nav`. `position:sticky`
   always creates a stacking context, so `.nav`'s z-index resolves *inside* the header;
   a body-level scrim out-painted the whole header context and swallowed every tap
   (`elementFromPoint` at all 9 drawer controls returned the scrim).

**Assertion note:** `documentElement.scrollWidth === innerWidth` is no longer a valid
"no horizontal overflow" check now that clipping happens at the root — `scrollWidth`
reports unclipped extent. Assert `clientWidth === innerWidth` instead.

### Admin-panel bugs — it was corrupting content on every save

The panel edits the owner's real site content, so these mattered more than they look.
All fixed, all documented inline:

- The 6 category **Button Text** fields used `kind:'smart'` (icon-first helper) on
  text-first markup, so they read empty and appended after the arrow — every save,
  even one with no edits, turned "Enquire" into "Enquire →Enquire Now".
- **`SHOP_NAME`** was injected into `main.js` unescaped. An apostrophe ("Vinny's Pet
  Shop") wrote a syntax error, killing the whole IIFE — and since `.reveal` starts at
  `opacity:0` and only JS adds `.is-in`, **most of the page would render blank**.
- **Gallery `alt` text** was overwritten with the caption on save, destroying all six
  intentionally-different alts irrecoverably.
- **JSON-LD** was written via `JSON.stringify` without escaping `<`, so a pasted URL
  containing `</script>` would close the block and inject live HTML.
- **`OLD_DOMAIN` was a hardcoded constant** still pointing at the old placeholder
  domain, so after the move to vspetshop.com the Domain field matched nothing and
  became a silent no-op. It now reads the origin domain off the loaded document
  (`state.site.origDomain`) and can never go stale again.

### Accessibility — the form was a keyboard trap

`validate()` called `first.focus()` and was wired to `blur`, so a half-typed phone
number yanked focus straight back: you could not Tab or click out of the field
(WCAG 2.1.2). It also validated *both* fields on either blur, flagging a field the
user hadn't reached. Split into `validate(form, moveFocus)` (focus only on submit)
and a single-field `validateField()` for blur.

### Still open — see the audit findings, not yet fixed

Accessibility: form errors are not announced (no `aria-describedby`/`role="alert"`);
the closed mobile drawer keeps 9 links in the tab order (`visibility:hidden` fixes it);
`aria-live` on the tip strip interrupts screen readers every 5.5s; no pause control for
the marquees (WCAG 2.2.2); ~10 colour-contrast failures; 151 icon SVGs unmarked
`aria-hidden`. SEO: **this domain has prior history as an affiliate store and those URLs
are still indexed** — serve `410` for `/product/`, `/brand/`, `/wp-*`; `og-cover.jpg`
still 404s (breaks link previews *and* the JSON-LD `image`); the title truncates before
"Open 24 Hours"; the gallery still calls stock photos "actual photos from our store",
which is a §6 content-integrity problem.

### Performance round — what actually moved the needle

Measured on production with Playwright + CDP (Moto G Power, 4G throttle, 4× CPU,
medians of 5). Two caveats that cost the auditor time and will cost you the same:
**Hostinger's CDN serves a JS bot-challenge to Lighthouse** (403 `ERRORED_DOCUMENT_REQUEST`),
so Lighthouse cannot run against the live URL — test a local copy. And the PageSpeed
Insights API quota is easy to exhaust.

- **The hero fade was gating LCP, not the image** (fixed, §21). Chrome will not accept
  an LCP candidate while it is `opacity:0`, and `.hero__media` carried `data-anim="3"`
  = 300ms delay + 700ms fade. On production the hero image finished downloading at
  **1042ms** while LCP fired at **2824ms**. A/B, 5 runs each, identical bytes:
  **LCP 3452ms → 1888ms, −1564ms**, collapsing onto FCP. One CSS rule.
- **Fonts are now self-hosted** (§0). The `media="print"/onload` swap applies the font
  stylesheet after first paint and reflows all text at once. It is invisible on a slow
  connection but inverts when first-party CSS is fast — which is exactly Hostinger's
  own vantage point, and the likely explanation for their 78. Harness reproducing that
  condition: **CLS 0.38 / score 68** as-was, **CLS 0.00 / score 89** self-hosted.
- **`main.js` was being cached for 7 days, not a year** (fixed, `.htaccess`). Hostinger
  serves `.js` as `application/x-javascript`, which the existing
  `ExpiresByType application/javascript` rule never matched.

**Do not** do these — measured and rejected: `preconnect` to images.unsplash.com (≈0ms,
the hero `rel=preload` already opens that connection); minifying CSS/JS (<1 point, and
it costs the readability the no-build constraint depends on); converting images to WebP
(**Unsplash already serves AVIF** via `auto=format` — WebP would be *larger*).

**Correction to an earlier claim in this file:** the hero's `480w` srcset candidate is
dead on real phones. `sizes="(max-width:900px) 440px"` × DPR 2.625 = 1155px, so the
browser always picks `900w`. The note that "phones no longer download the same 900px
source a desktop does" was wrong. Current behaviour is still correct (900w is right for
a 370px box at DPR 2.6); when real photos land, re-derive `sizes` from the true render
box of **370px**, not 440px.

**Images are not the bottleneck.** Replacing the Unsplash placeholders is worth roughly
**0–2 points** — do it for trust/SEO/content-integrity reasons (see §6 and the open SEO
items above), not for speed. The Google Maps iframe is 465KB but correctly lazy-loaded
and costs **0 points**; facading it is a mobile-data kindness, not a perf fix.

### SEO + content-integrity round

- **This domain has a previous life.** `vspetshop.com` was an Amazon-affiliate
  WooCommerce store before this shop bought it, and those URLs were still in Google's
  index (verified: `/brand/visit-the-aibors-store/`, `/product/xsyg-dog-boots…`).
  `.htaccess` now returns **410 Gone** for `/product/`, `/product-category/`, `/brand/`,
  `/category/`, `/tag/`, `/author/`, `wp-*` and `/feed/` — 410 de-indexes faster than
  the 404 they were returning. **Do not 301 these to the homepage**; hundreds of
  irrelevant product URLs redirecting to `/` produces soft-404s, which is its own
  quality problem. Expect them to drop out over 4–8 weeks.
  **Still to do (needs the owner):** set up Google Search Console as a *Domain*
  property (DNS TXT at GoDaddy) and check **Manual actions** first — if the previous
  owner earned a penalty, it is inherited and nothing else in the SEO list matters
  until it's cleared.
- **`robots.txt` no longer carries `Disallow: /admin/`.** It is a public file, so that
  line advertised the admin panel's existence — and it also stopped Google crawling the
  page, which is the only way it can see the `noindex` meta tag. `/admin/.htaccess` now
  sends `X-Robots-Tag: noindex, nofollow, noarchive` instead. Keep all three layers
  (header, meta tag, not sharing the URL); do not re-add the Disallow.
- **Gallery copy de-claimed.** It read "Real photos" / "Actual photos from our store",
  with a caption naming Tech Zone IV and `alt="VS Pet Shop storefront"` — all attached
  to Unsplash stock. That is the same §6 violation that got "5,000+ happy families"
  removed, and worse, because it's a checkable claim about a real address. Restore the
  stronger wording only once the owner's own photos are in `assets/img/`.
- **`og:image` was a 404**, so every WhatsApp share rendered with no image — a direct
  conversion loss for a shop whose main channel is WhatsApp. Now points at the hero
  photo cropped to 1200×630 as an **interim**. Deliberately the dog photo rather than a
  stock storefront, so it reads as brand imagery instead of asserting premises.
  Same for the JSON-LD `image` (a required property for LocalBusiness — a 404 there can
  forfeit rich-result eligibility). Replace both with a real photo when one exists.
- **Title was 84 chars** and truncated before "Open 24 Hours" — the shop's only real
  differentiator against the competitor 300m away. Now 56 chars, local term first.
- JSON-LD gained `@id`, `currenciesAccepted`, `paymentAccepted` (verbatim from FAQ 7,
  not invented), `areaServed: Greater Noida` (supported by FAQ 2's delivery answer), and
  `telephone` in E.164. **`admin.js`'s JSON-LD writer was updated to emit E.164 too** —
  if you change one, change the other or the owner's next save silently reverts it.
- Footer address was missing "Amrapali Dream Valley" and "Uttar Pradesh" — two different
  address strings on one page is a real NAP inconsistency for local ranking. Fixed.
- `sitemap.xml` dropped `changefreq`/`priority` (Google ignores both) and gained
  `lastmod`. Update `lastmod` when *content* changes, not on CSS tweaks.

### Accessibility fixes shipped (blockers only)

- **Form errors are now announced.** Each input has `aria-describedby` pointing at its
  error `<small>`, which carries `role="alert"`. Previously a screen-reader user heard
  "invalid entry" and was never told what was wrong, on the site's only conversion path.
- **The closed mobile drawer no longer holds 9 focus stops.** It was `translateX(105%)`
  but still `display:flex`, so tabbing from the logo walked through the close button,
  7 links and the CTA — all off-screen, no visible focus ring, unscrollable because the
  panel is `position:fixed` under `html{overflow-x:hidden}`. Now `visibility:hidden`
  when closed, with a 340ms delay so the slide-out still animates.
- **The tip strip's `aria-live` is gone.** It swapped text on a permanent 5.5s interval,
  so screen readers interrupted with a new fact every 5.5 seconds for the whole visit,
  and the hover/focus pause never fires in browse mode. The tips are decorative.

**Accessibility still open** (from the full audit, not yet fixed): no pause control for
the two marquees (hover-only, so unreachable by keyboard or touch — WCAG 2.2.2, and the
reviews marquee holds real content people want to read); ~10 contrast failures including
the WhatsApp FAB glyph (1.98:1, needs 3:1) and the ribbon text (2.80:1, needs 4.5:1);
151 icon `<svg>`s unmarked `aria-hidden`; neither overlay confines focus (`inert` on the
rest of the page is the cheap fix); review marquee clones are duplicated in the a11y
tree; `.fab`/`.mobar` paint over the open drawer.
