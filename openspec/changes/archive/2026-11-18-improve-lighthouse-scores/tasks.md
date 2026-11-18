# Tasks

## 1. Repeatable Lighthouse audit

- [x] 1.1 Add `lighthouse@13.6.0` and `chrome-launcher@1.2.3` as exact-pinned devDependencies. Verify that `npm install` succeeds on Node 24, and that `node -e "import('lighthouse/core/lib/median-run.js').then(m => console.log(typeof m.computeMedianRun))"` prints `function`
- [x] 1.2 Write `scripts/lighthouse.js` (header comment in the style of `scripts/url-matrix.js`). It takes `<origin>` plus `--runs N` (default 3), `--form mobile|desktop` and `--json-dir DIR`. It reads paths from `src/data/pages.js`, launches headless Chrome once, uses the desktop config for desktop, and picks the median run with Lighthouse's `computeMedianRun`. Verify: `node scripts/lighthouse.js https://uphillskico.com --runs 1` prints 10 rows (5 pages × 2 form factors), each with perf/a11y/bp/seo, LCP, TBT and CLS
- [x] 1.3 Add the budgets from `specs/page-performance` as one constant. The accessibility budget also fails on any failing accessibility audit, including zero-weight ones such as `label-content-name-mismatch`. Add exit codes: 0 when all pass; 1 on a budget miss, listing each page/form/budget; 2 on a setup error such as no Chrome, an unreachable origin or a Lighthouse `runtimeError`. Verify: a production run exits 1 and names `/trailmaps.html` mobile LCP and the map pages' accessibility; `node scripts/lighthouse.js http://localhost:9 --runs 1` exits 2 with a clear message
- [x] 1.4 Add `"lighthouse": "node scripts/lighthouse.js"` to `package.json` and `.lighthouse/` to `.gitignore`. Document the command in the README's Development section, including that budgets are judged against a deploy preview or production rather than `astro preview`. Verify: the documented `npm run lighthouse -- https://uphillskico.com` runs as written, and `npm run lint` passes
- [x] 1.5 Record the baseline: run `npm run lighthouse -- https://uphillskico.com` (3 runs) and save the printed table to `openspec/changes/improve-lighthouse-scores/baseline.txt`. Verify that it matches the proposal's Lighthouse 13.6.0 baseline within run-to-run noise

## 2. Accessible names include visible text

- [x] 2.1 In `src/components/MapCard.astro`, remove the `aria-label` and add `<span class="visually-hidden">trail map</span>` after `.map-name`, outside it. Verify:
  - built `dist/trailmaps.html` cards have no `aria-label` and contain the hidden span
  - trail map search still filters by name
  - the viewer title still shows the bare map name
- [x] 2.2 Add a static `<span class="visually-hidden">Jump to </span>` at the start of `#ridgeFlagLink` in `src/pages/index.astro`, and remove the `setAttribute("aria-label", …)` in `src/hero.js`. Verify: in a local preview, the DevTools accessibility pane shows the flag link's name as "Jump to <rank> <name> <meta>" after hovering a peak, and the ridge jump still scrolls to the ticket
- [x] 2.3 Run `node scripts/parity-check.js` comparing a pre-change build with the new build. Verify that the only differences are the expected card and flag text additions, with no title, meta, JSON-LD or sitemap changes

## 3. Spotlight layer hidden until active

- [x] 3.1 In `src/styles/maps.css`, give `.topo-lit` `visibility: hidden; opacity: 0` with a short opacity/visibility transition, and show it under `.maps-hero.is-lit`. Verify: with no pointer over the hero, DevTools shows the layer's computed visibility as `hidden`
- [x] 3.2 In `initMapPage()` (`src/maps-grid.js`), add `is-lit` on `pointerenter` and remove it on `pointerleave`, inside the existing `(pointer: fine)` branch. Verify:
  - on desktop, the gold contours still follow the cursor and disappear on leave, looking the same as before
  - with touch emulation, the layer never becomes visible
- [x] 3.3 Build, start `npm run preview`, and run `npm run lighthouse -- http://localhost:4321 --runs 1`. Verify that accessibility is 100 on all 5 pages, mobile and desktop, with `color-contrast` and `label-content-name-mismatch` passing

## 4. Responsive thumbnails and LCP

- [x] 4.1 Export `THUMB_WIDTHS` (start with `[320, 480, 600]`) from `src/data/trailmap-images.js`, and pass `widths` and `sizes` (start with `(max-width: 560px) 50vw, (max-width: 660px) 100vw, 400px`) to the card `<Image>` in `MapCard.astro`, keeping `THUMB.width` at 600. Verify that built card `<img>` tags have a 3-entry `srcset`, a `sizes`, a `src` equal to the existing 600 px file, and explicit `width`/`height`, and that the viewer placeholder still loads
  - Note: `THUMB.quality` was later lowered from 58 to 36 (design Decision 2), so the `src` is now the 600 px file at the new quality; card, viewer placeholder and ticket galleries still share it
- [x] 4.2 Check `img.currentSrc` for the first card at viewport widths 412, 600, 900 and 1350 px, at DPR 1 and 2, in local preview. Tune `sizes` and `THUMB_WIDTHS` so the chosen width is the smallest one that covers the displayed width × DPR. Verify by recording the chosen width per case in the PR description
- [x] 4.3 In `maps.css`, add `.map-card:nth-child(-n + 4) { animation: none; }`, and give the first card's `<Image>` `priority` (index 0 only). Verify:
  - each map page's built HTML has exactly one `fetchpriority="high"` image, on the first card
  - cards 5 and later still animate in
  - with reduced motion emulated, no card is offset or faded
- [x] 4.4 Run `npm run lighthouse -- <origin> --form mobile` against a Netlify deploy preview. Verify:
  - `/trailmaps.html` and the resort map pages have median mobile LCP ≤ 2.5 s and performance ≥ 95
  - the `image-delivery-insight` estimate on `/trailmaps.html` is under 100 KiB

  If LCP still misses, reduce the eager set in `MapCard.astro` from 8 cards to the first 4 and re-run

## 5. Integration checks

- [x] 5.1 Run `npm run build` (including the inline-script check), `npm run lint` and `npx prettier --check .`; verify all pass
- [x] 5.2 Run `npm run lighthouse -- <deploy-preview-origin>` (3 runs, both form factors). Verify that it exits 0, and save the table to `openspec/changes/improve-lighthouse-scores/results-preview.txt`
  - Exception (accepted): the preview run exits 1 only on best-practices 92 and SEO 69, caused by Netlify, not the site. Netlify sends `x-robots-tag: noindex` on deploy previews, and the site's CSP blocks the injected Netlify Drawer iframe. Performance and accessibility pass every budget there. Production scores 100 on both (task 5.3)
- [x] 5.3 After merge and deploy, run `npm run lighthouse -- https://uphillskico.com`. Verify that it exits 0, and save the table to `openspec/changes/improve-lighthouse-scores/results-production.txt`

## Workflow follow-up

- Archive the change once production results are recorded.
- If `add-resort-pages` lands first, its 24 pages are audited automatically through `src/data/pages.js`. Any budget misses on them belong to that change or a follow-up, not this one.
