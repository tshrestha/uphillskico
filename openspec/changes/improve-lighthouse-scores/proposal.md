# Proposal

## Why

A Lighthouse 13.6.0 (latest stable) audit of production (`https://uphillskico.com`, 2026-11-18) shows the site is already strong: SEO and Best Practices are 100 on every page. Two problems remain. The trail map pages miss the mobile LCP target, and every map page loses accessibility points. There is also no repeatable way to re-run the audit, so regressions (for example, from the 24 upcoming resort pages in `add-resort-pages`) would go unnoticed.

Baseline (Lighthouse 13.6.0, median of 3 runs per page and form factor):

| Page | Mobile perf / LCP | Desktop perf | A11y | BP | SEO |
| --- | --- | --- | --- | --- | --- |
| `/` | 100 / 1.7 s | 100 | 100 | 100 | 100 |
| `/trailmaps.html` | **94 / 3.1 s** | 100 | **96** | 100 | 100 |
| `/trailmaps/aspen.html` | 96 / **2.7 s** | 100 | **96** | 100 | 100 |
| `/trailmaps/monarch.html` | 99 / 2.1 s | 100 | **96** | 100 | 100 |
| `/trailmaps/cooper.html` | 100 / 1.9 s | 100 | **96** | 100 | 100 |

Findings this change acts on:

1. **Oversized thumbnails.** Every map card ships a 600 px-wide WebP but displays it at about 171 px on mobile and about 300 px on desktop. Lighthouse's image-delivery insight estimates about 1.2 MB of savings on `/trailmaps.html` mobile (1.4 MB on desktop) and about 750 ms of LCP savings.
2. **LCP render delay.** The LCP element is the first map card's thumbnail. Element render delay is the largest part of its LCP time, about half of it: the image is downloaded but hidden by the `card-in` entrance animation (`opacity: 0` start, staggered delay). The image also lacks `fetchpriority="high"`.
3. **Colour contrast (a11y).** Hero text on map pages is reported as white-on-gold (1.4:1). The gold `.topo-lit` layer is a masked cursor spotlight that paints nothing until the pointer moves. axe can't evaluate CSS masks and treats the whole layer as the background. Visitors don't see this failure, but the layer is still present and full-size when the page loads.
4. **Accessible name mismatch (a11y).** Map cards (`aria-label="View Winter Park trail map"`) and the home page's ridge flag (`aria-label="Jump to Winter Park"`) have accessible names that don't contain their visible text (the rank number). This fails WCAG 2.5.3 *Label in Name* for speech-input users. In Lighthouse 13 this audit carries no score weight, so it doesn't lower the 96, but it still fails.

Findings deliberately **not** acted on: the home page has no performance issue (median 100 on mobile; one of 3 runs scored 97). Render-blocking CSS is flagged, but Lighthouse estimates 0 ms FCP/LCP savings. CLS is at most 0.046, within "good". DOM size (1,508 elements) comes from the prerendered lineup the site spec requires.

## What Changes

- Add a repeatable Lighthouse audit: `npm run lighthouse` runs every page in the page registry, mobile and desktop, several times each. It reports median scores and key metrics, and exits non-zero when a page misses the targets below. It can target production, a deploy preview or a local preview.
- Serve trail map thumbnails responsively. Each thumbnail `<img>` gets a `srcset` of smaller widths and a `sizes` that matches the card's layout, so the browser downloads roughly the displayed size. The existing 600 px file stays the `src`, which the viewer already uses as its placeholder.
- Make the LCP card thumbnail paint at once. The first card(s) in the grid skip the opacity entrance animation, and the first thumbnail is fetched with `fetchpriority="high"`. Later cards keep the stagger.
- Keep the cursor-lit topo layer out of the page until it's used. `.topo-lit` stays hidden (not just masked off-screen) until the pointer is over the hero on a fine-pointer device. The hover effect looks the same, and contrast is measured against the real hero background.
- Fix accessible names so they include the visible text, on map cards (trail maps index, resort map pages) and on the home page ridge flag. They must still name the resort and the action.
- Targets, as the median over repeated runs: mobile performance ≥ 95 and mobile LCP ≤ 2.5 s on every page; Accessibility, Best Practices and SEO 100 on every page, mobile and desktop.

## Capabilities

### New Capabilities

- `page-performance`: Loading performance budgets for public pages, and the repeatable Lighthouse audit that measures them. This covers which pages are audited, how results are aggregated, the score and metric targets, and the LCP rules for above-the-fold imagery.
- `accessibility`: Accessibility requirements across public pages. This covers accessible names that include visible label text, contrast measured against what's actually rendered, and a clean automated accessibility audit.

### Modified Capabilities

- `site-rendering`: The requirement "Trail map images are optimised and sized" gains a rule that thumbnails are offered at several widths, with `srcset`/`sizes` matching the card layout. The full-size viewer image and the explicit width/height rule are unchanged.

## Impact

- **Code**:
  - `src/components/MapCard.astro`: image `widths`/`sizes`, priority on the first card, accessible name
  - `src/data/trailmap-images.js`: thumbnail width set
  - `src/styles/maps.css`: `card-in` on leading cards, `.topo-lit` visibility
  - `src/maps-grid.js`: toggle the lit layer on pointer enter/leave
  - `src/pages/index.astro` and `src/hero.js`: ridge flag accessible name
  - New `scripts/lighthouse.js` and an `npm run lighthouse` script
- **Dependencies**: `lighthouse@13.6.0` and `chrome-launcher@1.2.3` as exact-pinned devDependencies. Lighthouse 13 needs Node ≥ 22.19, which the project's Node 24 meets. The audit needs a local Chrome/Chromium; it isn't run by `npm run build`.
- **Build output**: about 2 extra thumbnail files per trail map (30 maps → about 60 small WebP files). Page HTML grows slightly from `srcset` attributes.
- **Visual**: the first visible map cards no longer fade or slide in. Thumbnails are encoded at WebP quality 36 instead of 58 (decided during implementation, see design Decision 2), which looks the same at card size.
- **Related change**: `add-resort-pages` (in progress) will add 24 pages through `Base.astro`. Because the audit reads `src/data/pages.js`, those pages are covered automatically once they're registered. The fixes here don't depend on it.
- **Out of scope**: font subsetting, inlining CSS, CLS tuning below the current "good" range, DOM-size reduction of the home lineup, changes to the CSP or Netlify headers, and a CI integration (no CI exists in the repo today).
