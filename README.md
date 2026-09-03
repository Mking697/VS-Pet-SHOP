# VS Pet Shop — Static Landing Page

A single-page, conversion-focused landing site for a local pet shop.
Pure HTML + CSS + JavaScript — **no build step, no framework, no server code**.
Upload the folder to Hostinger and it works.

---

## 1. Files

```
VS Pet Shop/
├── index.html          ← the landing page (all sections)
├── 404.html            ← custom not-found page
├── CLAUDE.md           ← project context + status (for Claude Code sessions)
├── favicon.svg         ← paw-mark favicon
├── .htaccess           ← HTTPS redirect, gzip, caching, security headers
├── robots.txt
├── sitemap.xml
└── assets/
    ├── css/style.css   ← all styling (design tokens at the top)
    ├── js/main.js      ← all interactions (config at the top)
    └── img/            ← put your own shop photos here
```

---

## 2. What's already real

These are live on the site — no action needed:

- Phone / WhatsApp **+91 88512 03070**
- Email **vspetshop2007@gmail.com**
- Address **Shop No. 39, Habitech Panchtatva, near Galaxy Vega, Tech Zone IV,
  Amrapali Dream Valley, Greater Noida, UP 201318**
- Hours **Open 24 hours, all 7 days**
- Instagram and Facebook links
- "Get Directions" buttons point at the real Google listing
- All 7 testimonials are **real, unedited Google reviews**

## 3. Three things still to fill in

| # | What | Where |
|---|---|---|
| 1 | **Your real domain** — `www.vspetshop.in` is currently a guess | `index.html` (canonical + 3 OG tags), `sitemap.xml`, `robots.txt` |
| 2 | **YouTube channel URL** | Two links with `class="soc soc--yt"` — paste the URL into `href`, then delete the `hidden` attribute |
| 3 | **Real shop photos** | See §4 below |

> ⚠️ The Google star rating is shown visually and links to your Google listing, but it is
> **deliberately not** in the page's structured data. Google's rules don't allow a site to
> mark up its own Google reviews as a site rating — doing it can get the page penalised.
> This is the safe and correct setup; please don't "fix" it.

---

## 4. Replace the photos

Right now the page pulls demo photos from Unsplash so it looks complete out of the box.
**Swap these for real photos of your shop** — that's the single biggest trust factor
on a local business page.

1. Put your images in `assets/img/`.
2. In `index.html`, replace each `https://images.unsplash.com/...` URL with
   `assets/img/your-photo.jpg`.
3. Keep the `width`/`height` attributes roughly matching your image ratio — they
   prevent layout shift while the page loads.
4. Update the `alt` text to describe your actual photo.

**Optimise before uploading:** resize to ~1200px wide max, convert to WebP, and
target under 200 KB each. Use [squoosh.app](https://squoosh.app) — it's free.

Also create `assets/img/og-cover.jpg` (1200×630) — that's the preview image shown
when someone shares your link on WhatsApp or Facebook.

---

## 5. Deploy to Hostinger

### Option A — hPanel File Manager (easiest)

1. Log in to Hostinger → **Websites** → your domain → **File Manager**.
2. Open the `public_html` folder and delete Hostinger's default files.
3. Select everything **inside** this project folder (not the folder itself) and
   drag it in — or zip the contents, upload the zip, then **Extract**.
4. Confirm `index.html` sits directly in `public_html/`, not in a subfolder.
5. Visit your domain. Done.

### Option B — FTP

1. hPanel → **Files** → **FTP Accounts** → copy host, username, password.
2. Connect with FileZilla.
3. Upload all contents into `/public_html/`.

### After deploying

- hPanel → **Security** → **SSL** → install the free SSL certificate.
  The `.htaccess` already forces HTTPS once the certificate is active.
- If you use a **www** or **non-www** preference, set it in hPanel; the
  `.htaccess` handles the HTTP → HTTPS redirect only.
- Test on a real phone, not just a narrow desktop window.

---

## 6. What's built in

**Sections:** sticky header + mobile drawer · hero with staggered entrance ·
feature strip · 6 category cards (dogs, cats, birds, food, grooming, accessories) ·
scrolling ribbon · 6 services · why-us grid with
animated counters · photo gallery with lightbox · testimonial marquee (two rows,
opposite directions, real Google reviews) · FAQ accordion · contact block with map
and WhatsApp form ·
CTA band · footer · sticky mobile call/WhatsApp/directions bar.

**The enquiry form has no backend.** It validates the input, then opens WhatsApp
with the message pre-filled so the customer just taps send. That is deliberate —
static hosting can't send email, and WhatsApp converts better for local shops anyway.
If you later want emailed submissions, [Formspree](https://formspree.io) or
[Web3Forms](https://web3forms.com) drop in with one line of HTML.

**Performance & accessibility:** no framework (~86 KB total, uncompressed),
lazy-loaded images, one throttled scroll listener, SVG icon sprite,
keyboard-navigable everywhere, visible focus rings, `prefers-reduced-motion`
respected, WCAG AA contrast on body text.

---

## 7. Customising the look

All design decisions live as CSS variables at the top of `assets/css/style.css`:

```css
--brand:   #F97316;   /* main orange — change this and the whole site follows */
--accent:  #2563EB;   /* trust blue, used for focus rings */
--bg:      #FFF7ED;   /* warm cream page background */
--dark:    #241608;   /* footer / dark panels */
--r-lg:    26px;      /* card corner radius */
```

Fonts are Rubik (headings) and Nunito Sans (body), loaded from Google Fonts in
`index.html`. Swap the `<link>` and the two `font-family` values in the CSS to change them.

---

## 8. Local preview

```bash
# from this folder
python -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly with a double-click also works, but a local server
matches production behaviour more closely.
