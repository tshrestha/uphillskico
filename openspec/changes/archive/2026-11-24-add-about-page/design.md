# Design

## Context

See proposal.md for why this change is needed. The site is static Astro output (`build.format: "file"`) deployed to Netlify. Every page renders through `src/layouts/Base.astro`, which gets its canonical URL from the page registry (`src/data/pages.js`). The same registry drives `/sitemap.xml` and the Lighthouse audit (`npm run lighthouse`), so a page added to the registry is audited against the performance, accessibility and SEO budgets automatically.

Constraints that shape the design:
- **CSP**: `img-src 'self' data:` and `script-src 'self'`. The portrait must be self-hosted, and the page needs no inline scripts.
- **Public repository**: anything committed is public, including these artifacts. No contact details go in the repo.
- **Data rule**: resort facts come only from official resort pages (`resorts.json`). The About page is personal writing, but it must not contradict that data (see the `about-page` spec).

## Goals / Non-Goals

**Goals:**
- One static page that meets the same Lighthouse budgets as the rest of the site, with the portrait as its LCP element.
- Reuse the site's existing visual language: the header and footer, the season stamp look, and the colour tokens in both themes.
- Make the season-bound section clearly out of date once a season passes, without anyone having to remember.

**Non-Goals:**
- A CMS, Markdown content collection or i18n. It's one page of prose.
- A photo gallery. The layout takes one portrait. More photos are a later change.
- A share image per page. The About page uses the site share image, like every other page.

## Decisions

### D1. A plain Astro page with the copy as markup
`src/pages/about.astro` renders through `Base` with a compact hero band, then a single readable column of sections (max width about 65ch). The copy lives directly in the page as HTML.
- **Rejected:** a Markdown content collection. That's infrastructure for one page, and the page needs custom markup (lists, the season stamp, section anchors) that Markdown would fight.

`Base`'s `heroClass` prop gains `"about-hero"` so the critical CSS paints the hero's background before the stylesheet loads, as it does for the other heroes. Page styles go in a new `src/styles/about.css`, imported only by this page.

### D2. Portrait through `astro:assets`
The source photo is copied to `src/assets/images/about/tejen-shrestha.jpeg` (a 1740×1740 square). It's rendered with `<Picture>`:
- formats AVIF and WebP, with a re-encoded JPEG fallback
- widths of about 1× and 2× the displayed size (displayed at about 200 px, so 200 and 400, plus 320 for larger layouts if needed)
- explicit `sizes`
- `loading="eager"` and `fetchpriority="high"`, since it's the likely LCP element

Sharp re-encodes every output without copying EXIF, so the served files carry no metadata. A task checks this on the built files, not on the assumption. The original is never placed in `public/`, where it would be served byte-for-byte.

Alt text: "Tejen Shrestha, smiling in the sun".

### D3. Season label reuses the season stamp
`SeasonStamp.astro` gains an optional `kind` prop: `"policy"` (the default, unchanged text) or `"written"`. With `"written"`, the text is `<season> season` when the season is current and `Written in <season>` otherwise, and the icon and current/stale styling are the same as the policy stamp. The `.season` rules move from `home.css` to `site.css` so both pages get them.

The About page sets its season in one constant next to the section (`"2026-27"`). Updating the section each fall means editing that constant and the copy together. Moving `CURRENT_SEASON` on in `src/shared.js` makes a forgotten section show "Written in 2026–27" by itself.
- **Rejected:** copy written to never go stale. It would lose the A-Basin and Power of Four details, which are the most alive part of the page.
- **Rejected:** a separate About-only stamp component. Two components would drift.

### D4. Navigation and links
- `Base`'s `current` prop gains `"about"`. The primary nav and the footer nav each add an **About** link after "Trail maps".
- The lineup rank note in `src/pages/index.astro` ends with a link, "How I rank them", to `/about.html#how-this-guide-works`. The section `h2` carries `id="how-this-guide-works"`.
- No "Send me a correction" link is added yet. `add-feedback-form` adds it once `/feedback.html` exists, so there's never a dead link.

### D5. Metadata
- **Title:** `About Tejen Shrestha | Uphill Ski Colorado`
- **Description:** `Why Tejen Shrestha built Uphill Ski Colorado, how the guide's uphill data is gathered from official resort websites, and how the resorts are ranked.`
- **Keywords:** `about uphill ski colorado, Tejen Shrestha, uphill skiing guide, Colorado ski touring`
- **Share image:** the site share image and its existing alt text pattern.
- **JSON-LD:** `ProfilePage` with `mainEntity` a `Person` (`name`, `image` as the absolute URL of a processed portrait from `getImage()`), plus `url` set to the page's canonical URL. No `email`, `telephone`, `address` or `birthDate`.
- The site-wide `<meta name="author">` stays "Uphill Ski Colorado".

### D6. Registry, sitemap and headers
- **Registry:** `src/data/pages.js` gets `{ path: "/about.html", lastmod: <ship date>, changefreq: "yearly", priority: "0.5" }`.
- **Headers:** `public/_headers` gets a `/about.html` must-revalidate rule, matching the other HTML pages.
- **URL matrix:** `scripts/url-matrix.js` adds `/about.html` and `/about` so preview and production can be compared.

### D7. Ordering with `add-resort-pages`
Both changes modify the `site-rendering` requirement "Public page URLs are stable". Each delta lists only its own addition on top of the current main spec. Whichever change is archived second must first update its delta to list both `/about.html` and the `/resorts/<slug>.html` pages, so archiving doesn't drop the other change's URLs.

## Approved page copy

This copy was approved by the owner on 2026-11-24 after an interview. Use it as written. Typographic quotes and dashes are fine. Any edit to a fact (dates, counts, names, prices) needs the owner's approval.

**Header**
- Name (`h1`): Tejen Shrestha
- Intro: Software developer in Denver, uphill skier, and the person who keeps this guide up to date.

**Why I built this**

It started as a way to get into the mountains without buying an expensive lift pass. I knew about backcountry skiing, but I had no idea you could skin uphill at resorts. I found out by accident while browsing Winter Park's trail maps, when I spotted a dedicated uphill route map.

I dug in and learned you could skin up Winter Park all day, every day, for $25 a season. I was stoked. I went straight to Marketplace to find a used splitboard, and uphilling made me fall in love with Winter Park. It's such a wonderful winter playground.

Then I got curious about the other resorts. I spent a lot of time poring over trail maps and planning weekend routes. I'm a software developer by day and I've always liked building things, so this turned into a side project I hoped other splitboarders and skiers would find useful.

**About me**

I was born in Kathmandu, Nepal, and grew up in awe of the Himalayas. When I was twelve, my family moved to Silver Spring, Maryland. There are no mountains there, and I missed them a lot. A couple of decades later, climbing and mountain biking brought my love of the outdoors back.

In 2022, my wife and I moved to Denver, and the mountains have been my playground ever since. I've gotten really into trail running in the mountains, gravel riding and scrambling the Flatirons. In 2025 I finished the Leadville Heavy Half, the GoPro Mountain Games 20K and the Boulderthon marathon. This year's race was the 10 Seconds Flat: ten laps of the Second Flatiron, an unofficial backyard race among friends. Whatever the season, my favourite thing is being up high and finding a good traverse.

Backyard favourites (list):
- The First, Second and Third Flatirons
- Green Mountain, Bear Peak and South Boulder Peak
- Staunton State Park
- Apex Park
- The Tenmile Range above Frisco

**On the skin track** (season stamp: 2026-27, kind "written")

My first uphill season was 2024–25, on a splitboard. For 2025–26 I switched to skis. The first few outings were rough, but after a few lift-served days it clicked. I got in 19 uphill days and about 5 downhill days, more than the season before, even though uphill opened about a month late at Winter Park.

I still feel incredibly lucky to have places like Winter Park to play in all winter. Skinning to the top of Pano for the first time was a genuine "wow."

This season I've already been up A-Basin, a new one for my uphill list, and I've signed up for the Aspen Power of Four, so there's a lot of uphill training ahead.

My setup (list):
- Skis: Atomic Backland UL 86
- Boots: Scarpa F1 LT

**How this guide works** (`id="how-this-guide-works"`)

Every policy here comes from the resort's own official website. Uphill details come out gradually through the fall and change during the winter, so I update the guide several times a season. Code I wrote for this site does most of the gathering, but I check everything by hand against each resort's official page.

The ranking weighs ease of access, hours, cost, and how much ground you can cover. To be honest, Winter Park being #1 is partly personal bias. It's where I started skiing, and the ski train lets me skip the I-70 madness. But I also think it has the best price and policy, and a lot of mountain you can cover on skins.

I wish more resorts followed Winter Park's lead. Several of the big resorts, especially on the Epic side, only allow uphill before and after lift hours. Maybe that's for insurance reasons, but I think opening up uphill access would bring them more visitors and more business.

**Editorial notes**
- The $25 is told as part of how the owner got started. `resorts.json` currently lists Winter Park's 2026–27 price as not posted. If the official store confirms $25 for 2026–27, update `resorts.json` from that source separately. Don't change this copy to present tense.
- The Epic sentence matches the data: five of the six Epic resorts (Vail, Breckenridge, Keystone, Beaver Creek, Crested Butte) don't allow uphill during lift operations. If that changes in `resorts.json`, revisit the sentence.
- The birth year is left out on purpose ("when I was twelve" only).

## Risks / Trade-offs

- **[The portrait misses the LCP budget on mobile]** → Eager load with high fetch priority, AVIF at the displayed size, and a fixed aspect-ratio box so there's no CLS. The audit in the migration plan checks it.
- **[The personal copy goes out of date: the race list, the "this season" paragraph]** → The season stamp flags the most time-bound section on its own. The rest is written with explicit years, so it stays true as it ages.
- **[The Epic opinion reads as an attack on resorts]** → It's framed as the owner's opinion, grounded in what the guide shows (lift-hours restrictions), with an acknowledged reason ("maybe insurance").
- **[The rank note admits bias while the lineup presents a ranking]** → That's deliberate. Being transparent about bias builds more trust than an implied neutral ranking.
- **[Merge conflict with `add-resort-pages` in specs and registry]** → See D7. The code conflicts are one-line additions to the same lists.

## Migration Plan

1. Implement on a branch. Run `npm run build` (including the inline-script check) and `npm run lint`.
2. Run `scripts/parity-check.js` against a baseline build. The only expected differences are the new `/about.html` page and its sitemap entry. Nav, footer and rank-note links aren't part of the comparison.
3. On the Netlify deploy preview:
   - run `npm run lighthouse` against the preview, which covers `/about.html` through the registry
   - run `scripts/url-matrix.js` for `/about.html`
   - check the page in light and dark themes and at 400 px wide
4. Deploy, then resubmit `/sitemap.xml` in Search Console.
5. **Rollback:** Netlify instant rollback. Nothing else depends on `/about.html` until `add-feedback-form` lands.
