# Design

## Context

See proposal.md (Why) for the baseline numbers. The current state that shapes the approach:

- **Thumbnails.** `MapCard.astro` renders `<Image {...THUMB}>`, with `THUMB = { width: 600, quality: 58, format: "webp" }` from `src/data/trailmap-images.js`. There is no `srcset`. The first 8 cards are `loading="eager"`. The same 600 px file serves three uses: the card `src`, the viewer's placeholder (`cardToMap()` reads `img.getAttribute("src")`), and the `getThumbSrc()` output for ticket galleries.
- **Grid widths** (`src/styles/maps.css`):
  - ≤ 560 px viewport: 2 columns, about `50vw − 2rem`, roughly 171 px at 412 px.
  - Above that: `repeat(auto-fill, minmax(min(100%, 17rem), 1fr))` inside `--wrap: 1260px`, with gutters of `clamp(16px, 4vw, 44px)`. From about 561–660 px that's a single column (about 500–560 px wide). Otherwise columns are about 272–400 px, about 297 px at a 1260 px wrap with 4 columns.
- **Card animation.** `.map-card` runs `card-in` (opacity 0 → 1, translateY) with `backwards` fill and a stagger of `min(--n, 12) × 40ms`. `site.css` already collapses all animations under `prefers-reduced-motion: reduce`.
- **Topo hero.** `.topo-lit` is a full-hero gold layer, masked by the topo SVG intersected with a radial gradient at `--mx/--my`. Those default to `-999px`, so nothing is painted. `initMapPage()` in `src/maps-grid.js` updates them on `pointermove`, only for `(pointer: fine)`.
- **Accessible names.** `MapCard.astro` sets `aria-label="View {name} trail map"`, but the visible content is the rank chip (`1`) followed by `.map-name`. `src/hero.js` sets `aria-label="Jump to {name}"` on `#ridgeFlagLink`, whose visible content is the rank, name and meta line.
- **Existing scripts.** `scripts/url-matrix.js` and `scripts/parity-check.js` are plain Node ESM scripts that take an origin or directory argument. `src/data/pages.js` is a dependency-free ESM module that lists every public path.
- **Hosting.** Netlify serves Brotli/gzip and the `_headers` cache rules. `astro preview` serves neither, so it isn't representative for performance budgets.

## Goals / Non-Goals

**Goals:**
- Meet the budgets in `specs/page-performance` and `specs/accessibility` without any visible change, apart from the leading cards no longer animating in and a lower thumbnail quality that looks the same at card size.
- Make the audit a one-command, repeatable check whose page list follows the registry.

**Non-Goals:**
- Running the audit in `npm run build` or in CI. It needs Chrome and a reachable origin, and there is no CI in the repo.
- Tuning the home page (already 100 when measured over medians), fonts, CSS delivery or CLS.
- Changing the full-size viewer images or the home page's trail-map fan images.

## Decisions

### 1. Audit runner: a small Node script on the Lighthouse API, not Lighthouse CI
`scripts/lighthouse.js <origin> [--runs N] [--form mobile|desktop] [--json-dir DIR]`:

- It imports `pages` from `src/data/pages.js`.
- It launches headless Chrome once with `chrome-launcher`.
- For each path and form factor (desktop uses Lighthouse's desktop config), it runs Lighthouse `--runs` times (default 3).
- It picks the median run with Lighthouse's own `computeMedianRun` helper (`lighthouse/core/lib/median-run.js`; Lighthouse ships no `exports` map, so the deep import works, as verified in 13.6.0). It prints a table, checks the budgets and exits 1 on any miss. A setup error (no Chrome, unreachable origin, a Lighthouse `runtimeError`) exits 2 with the reason.
- The accessibility budget checks for failing audits as well as the category score. In Lighthouse 13, `label-content-name-mismatch` carries no weight, so a score of 100 alone wouldn't catch it.
- Lighthouse 13 replaced the older performance audits with insights. The script reads `image-delivery-insight` for image sizing (the old `uses-responsive-images` no longer exists) and `lcp-breakdown-insight` for the LCP subparts.
- With `--json-dir`, the median reports are written to a gitignored `.lighthouse/` directory for inspection.

`npm run lighthouse -- https://uphillskico.com` is the entry point. Budgets live in one constant at the top of the script.

*Alternatives:*
- `@lhci/cli` brings its own assertion DSL, upload server and config. That's more machinery than a five-page static site needs, and it adds little without CI.
- `npx lighthouse` in a shell loop needs no dependency, but it can't take medians or enforce budgets without extra parsing, and an unpinned `npx` isn't reproducible.

*Dependency:* `lighthouse@13.6.0` (latest stable, released 2026-10-27) and `chrome-launcher@1.2.3`, as exact-pinned devDependencies. Lighthouse 13 needs Node ≥ 22.19, which the project's `engines` (Node 24) meets. Exact pins keep runs reproducible; the lockfile cost is acceptable for a dev-only tool.

### 2. Responsive thumbnails through `<Image widths sizes>`
`MapCard.astro` passes `widths={THUMB_WIDTHS}` (proposed `[320, 480, 600]`) and a `sizes` derived from the grid rules above. The proposed value is `(max-width: 560px) 50vw, (max-width: 660px) 100vw, 400px`; tasks verify and tune it.

`width: 600` stays in `THUMB`, so `src` (and therefore the viewer placeholder and `getThumbSrc()`) is still the 600 px thumbnail. 320 covers the mobile 2-column card at DPR ≈ 1.75 and the desktop 4-column card at DPR 1. 480/600 cover the single-column range and HiDPI desktops.

*Measured during implementation:* the grid bands differ from the estimate above (1 column only from 561 to 608 px, then 2, 3 and 4 columns, the last capped at about 258 px). `THUMB_SIZES` in `src/data/trailmap-images.js` has one slightly over-estimating value per band; `thumb-widths.txt` records the chosen file per viewport and DPR.

*Thumbnail quality (decided during implementation):* with sizing fixed, `image-delivery-insight` still estimated 290 KiB on `/trailmaps.html` mobile, all of it "increase the compression factor". Lighthouse's target is 2/12 bytes per pixel whatever the format, and the dense map thumbnails missed it at WebP quality 58. `THUMB.quality` is lowered to 36 (measured: q45 183 KiB, q40 113 KiB, q36 79 KiB), which looks the same at card size. Rejected: AVIF thumbnails (would change every thumbnail file, the viewer placeholder and ticket galleries), and narrowing the spec target to sizing only.

*Alternatives:*
- `densities` keys off a fixed CSS width, but the card width is fluid.
- Shrinking `THUMB.width` to 320 everywhere would blur the viewer placeholder and HiDPI cards.
- `layout="constrained"` would also inject Astro's responsive-image styles. This site sizes thumbnails with its own CSS (`object-fit: cover` in an `aspect-ratio` box), so explicit `widths`/`sizes` are less invasive.

### 3. Leading cards paint immediately
- `.map-card:nth-child(-n + 4) { animation: none; }` covers the first row on desktop and the first two rows on mobile. A structural selector needs no extra markup, and it follows filtering only loosely. That's acceptable: when the search filters cards, the entrance animation doesn't replay anyway.
- The first card's `<Image>` gets `priority`, which Astro renders as `fetchpriority="high"`, `loading="eager"` and `decoding="sync"`.
- Cards 2–8 stay eager and `decoding="async"`. With thumbnails about 4× smaller, the bandwidth contention among the 8 eager images mostly goes away. Narrowing the eager set is a fallback only if LCP still misses (task 4.4).

*Alternative:* keep the animation but drop only its opacity (transform-only). That's rejected as the default because the LCP render delay comes from the hidden start state, and a translate on the first viewport adds no value. It stays a fallback if the user wants the motion back.

### 4. Spotlight layer is hidden until the pointer is over the hero
- `.topo-lit` gets `visibility: hidden; opacity: 0`, with a short opacity transition.
- `.maps-hero.is-lit .topo-lit` shows it.
- `initMapPage()` adds `is-lit` on `pointerenter` and removes it on `pointerleave`, inside the existing `(pointer: fine)` branch, next to the `--mx/--my` handling.

Hidden layers are excluded from axe's contrast computation, so contrast is measured against the real sky gradient. Painting is unchanged while the pointer is over the hero.

*Alternatives:*
- `aria-hidden` is already set, and axe still uses the layer as background.
- Moving the layer below the text doesn't help: it's already z-index −1, and axe treats it as the text's background.
- Removing the layer from the DOM and creating it from JS would complicate the prerendered markup for no gain.

### 5. Accessible names come from content plus a visually hidden phrase
- **Map card:** drop `aria-label` and add `<span class="visually-hidden">trail map</span>` after `.map-name`, giving a name such as "1 Winter Park trail map". The visible text comes first, in visual order. `.map-name` textContent stays bare, so `cardToMap()` and the trail-map search are unaffected.
- **Ridge flag:** stop setting `aria-label` in `hero.js` and add a static `<span class="visually-hidden">Jump to </span>` at the start of `#ridgeFlagLink`, giving "Jump to 1 Winter Park Ikon · Open during lift ops".

`.visually-hidden` already exists in the critical CSS.

*Alternative:* rewrite each `aria-label` to begin with the visible text (`"1 Winter Park, view trail map"`). That works, but it duplicates the content in an attribute that can drift from what's shown.

## Risks / Trade-offs

- **Lab numbers are noisy.** Simulated throttling plus edge-cache misses give TBT outliers, as the baseline's 700 ms run showed. → Medians of ≥ 3 runs. Budget failures name the metric so a rerun can confirm.
- **`sizes` can be wrong at some breakpoint.** The browser then over- or under-fetches. → Task 4.2 checks `currentSrc` at 412, 600, 900 and 1350 px, at DPR 1 and 2.
- **About 60 more processed images per build.** Build time and `dist/` grow slightly. → Small WebP files; Astro's image cache keeps rebuilds fast.
- **Local preview isn't production.** It has no compression or `_headers`, so budgets may fail locally for reasons production doesn't share. → The script prints the origin. Docs state that budgets are judged against a deploy preview or production; local runs are for quick feedback.
- **The first cards stop animating.** This is a small visual change. → It's limited to 4 cards; the rest keep the stagger.
- **Lighthouse version drift.** Audit IDs and thresholds change between majors. → Pinned to 13.6.0. Any upgrade is a deliberate change that re-records the baseline (task 1.5) and re-checks the audit IDs the script reads.

## Migration Plan

1. Land the audit script first and record a baseline with it against production (it should reproduce the proposal's numbers).
2. Land the fixes, build, and check them on a Netlify deploy preview with `npm run lighthouse -- <preview-origin>`.
3. Merge and deploy, then run the audit against production.

Rollback is a revert: no URLs, data or headers change.

## Open Questions

- Exact `sizes` string and width set. Starting values are given above; final values come from task 4.2's measurement and don't change the approach.
