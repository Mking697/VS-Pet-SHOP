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

- **Domain name** — `www.vspetshop.in` is a guess used in canonical, OG and sitemap URLs.
  Must be corrected before launch.
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
├── .htaccess           HTTPS force, gzip, cache headers, security headers, 404
├── robots.txt
├── sitemap.xml
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

### JS modules in main.js (numbered 1–15)

year · sticky header · nav drawer · scroll-spy active link · reveal+stagger observer ·
counters · marquee init (clones the set, computes duration from width) · lightbox ·
FAQ single-open · form→WhatsApp · back-to-top · one throttled scroll listener ·
Escape closes overlays · broken-image fallback · marquee re-measure on resize.

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
- [x] SEO: local-intent title/description, LocalBusiness (PetStore) JSON-LD, OG tags,
      sitemap, robots
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
      stale file. Currently `v=2` (index.html lines 30 and 728, 404.html line 12).

### Blocked on the owner

- [ ] **Real shop photos** — the page currently uses 12 Unsplash demo images.
      Their GMB has real interior photos; those should replace the demos.
      Put them in `assets/img/`, resize ≤1200px, convert to WebP, ≤200 KB each.
- [ ] **`og-cover.jpg`** (1200×630) for WhatsApp/Facebook link previews — does not exist yet.
- [ ] **Real domain** — replace every `www.vspetshop.in`.
- [ ] **YouTube URL** — then remove the `hidden` attribute on the two `.soc--yt` links.

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
