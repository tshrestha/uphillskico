# Tasks

## 1. Baseline and parity tooling

- [x] 1.1 Before touching the build, run the current `npm run build` and save a baseline snapshot of `dist/` outside the repo's `dist/`, e.g. `.baseline/dist/` (gitignored). Verify the snapshot contains `index.html`, `trailmaps.html`, `trailmaps/{aspen,monarch,cooper}.html` and `sitemap.xml`.
- [x] 1.2 Save the live production URL matrix: status code and `Location` for `/`, `/index.html`, `/index`, `/trailmaps`, `/trailmaps/`, `/trailmaps.html`, `/trailmaps/aspen`, `/trailmaps/aspen/`, `/trailmaps/aspen.html`, `/sitemap.xml`, `/og-image.png`, `www.` and `http://`. Store it in `.baseline/url-matrix.txt` via a small `scripts/url-matrix.js <origin>` script. Verify that running it against production reproduces the saved file.
- [x] 1.3 Add `scripts/parity-check.js <baselineDir> <newDir>`. It compares the set of `.html` paths, and per page compares `<title>`, meta description, canonical, robots, `h1`/`h2` text, parsed JSON-LD, visible text of tickets and map cards, and the sitemap `<loc>` set, then prints the differences. Verify that running it baseline-vs-baseline reports no differences.

## 2. Astro scaffold with URL-preserving config

- [x] 2.1 Add `astro` (7.x) and remove the direct `vite`, `vite-plugin-minify` and `vite-plugin-image-optimizer` dev dependencies. Keep `sharp`, `sass` and `svgo`. Verify `npm install` succeeds on Node 24 and `npx astro --version` prints 7.x.
- [x] 2.2 Create `astro.config.mjs` with:
  - `site: 'https://uphillskico.com'`
  - `build.format: 'file'`
  - `trailingSlash: 'never'`
  - `compressHTML: true`
  - `vite.build.target: 'es2025'`
  - `json.stringify` kept

  Delete `vite.config.js`. Verify an empty `src/pages/index.astro` builds to `dist/index.html`.
- [x] 2.3 Spike (design Open Question): find the Astro 7 setting that stops processed `<script>` tags being inlined (start with `vite.build.assetsInlineLimit`). Test it with a deliberately tiny script. Record the answer in design.md D7. Verify the built HTML loads the tiny script through `src=` only.
- [x] 2.4 Add `scripts/check-inline-scripts.js`. It fails with a non-zero exit when any `dist/**/*.html` has a `<script>` without `src` whose type isn't `application/ld+json`. Verify it fails on a fixture page with an inline script and passes without one.
- [x] 2.5 Update the `package.json` scripts:
  - `dev`: `astro dev`
  - `build`: `astro build && node scripts/check-inline-scripts.js`
  - `preview`: `astro preview`
  - remove `prebuild` and `thumbs`, keep `texture`

  Verify `npm run build` runs both steps.
- [x] 2.6 Add `eslint-plugin-astro` and `prettier-plugin-astro` to `eslint.config.js` and the Prettier config. Verify `npm run lint` and `npx prettier --check .` pass on the scaffold.

## 3. Shared layout and page registry

- [x] 3.1 Create `src/data/pages.js`, the page registry. It holds each public page's path, canonical URL and explicit `lastmod`, seeded from the current `sitemap.xml` values. Verify it lists exactly the 5 current page paths.
- [x] 3.2 Create `src/layouts/Base.astro`. It owns the critical inline CSS, font preload, title, description, robots, canonical (from the registry), Open Graph and Twitter tags (pointing to `/og-image.png`, 1200x630, with alt), manifest, favicon, theme-color, and the header and footer. Verify that a test page using it renders every tag with the right values.
- [x] 3.3 Load the site styles (`site.css`, `home.css`, `maps.css`, `viewer.css`) through the layout and pages. Verify the styles load from `/_astro/*.css` and nothing in the built HTML points at `/src/`.

## 4. Home page

- [x] 4.1 Port `generateTicket()` to `src/components/ResortTicket.astro`, with badge, season-stamp and barcode helpers. Keep every class, id, `data-*` attribute and `view-transition-name` the same. Verify the parity check reports identical ticket visible text for all 24 resorts, and that stale-season resorts (e.g. Copper Mountain) show "Last confirmed 2025–26".
- [x] 4.2 Render the ridge by calling the existing `generateRidge(resorts)` through `<Fragment set:html>` at build time. Verify the ridge `<svg>` markup matches the baseline after whitespace normalisation.
- [x] 4.3 Create `src/pages/index.astro` from `index.html`, using the layout, `ResortTicket` and the ridge. Compute the resort count, the filter option counts and the meta-description counts from `resorts.json`. Verify the parity check shows no unintended differences for `/`.
- [x] 4.4 Generate the home JSON-LD from objects with `JSON.stringify` in `is:inline` `application/ld+json` scripts:
  - `WebSite`
  - an `ItemList` of the top 3 by rank, from data
  - `FAQPage`, keeping the existing hand-written answers

  Verify the parsed JSON-LD matches the baseline. Also verify that changing the rank order in a scratch copy of the data changes the ItemList.
- [x] 4.5 Move `main.js` into a processed `<script>` on the home page that imports the existing modules (`hero.js`, `skier3d.js`, `ui.js`, `utils.js`, `viewer.js`). Verify these all work in `astro preview`:
  - filters, autocomplete and reset
  - ridge jump
  - 3D skier
  - trail map viewer
  - theme toggle
  - headlamp glow
- [x] 4.6 Delete `index.html`, `main.js`, `scripts/generate-static.js` and the `generateTicket` and `STATIC_*` code paths that are no longer used. Keep the `shared.js` helpers the client still uses. Verify `npm run build` and `npm run lint` pass.

## 5. Trail map images through astro:assets

- [x] 5.1 Move `public/trailmaps/*.{webp,avif}` to `src/assets/trailmaps/`, and delete `public/trailmaps/thumbs/` and `scripts/generate-thumbs.js`. Verify `public/trailmaps/` no longer exists.
- [x] 5.2 Add a build-time trail map image resolver (`import.meta.glob` over `src/assets/trailmaps/*`). It maps the data's file names and the `resorts.json` `trailMap` image paths to:
  - a thumbnail via `<Image width={600}>`
  - a full-size URL via `getImage()`, keeping source format and dimensions

  `.html` paths pass through unchanged. Verify every `resorts.json` image `trailMap` and every trail map data entry resolves, and that the build fails on a missing file.
- [x] 5.3 Point ticket trail map links at the resolved full-size URLs. Verify on Vail and Beaver Creek that the viewer opens the full-size map at its original pixel dimensions, and that the text on the map is still legible.
- [x] 5.4 Move decorative images that the markup references (pass logos, `peak-texture.png`) to `src/assets` and import them. Leave CSS-referenced `/images/topo.svg` in `public/`. Verify none of them 404 in `astro preview`.

## 6. Trail map pages

- [x] 6.1 Create a prerendered `MapCard` component that matches `renderMapCards()` output. It uses resolved thumbnails with explicit width and height, eager loading for the first 8 cards and lazy loading for the rest. Verify the markup matches the baseline card structure.
- [x] 6.2 Create `src/pages/trailmaps.astro` with all map cards prerendered and the trail map count computed from data. Verify that the HTML, read without JavaScript, contains all 30 cards.
- [x] 6.3 Create `src/pages/trailmaps/[resort].astro` with `getStaticPaths()` for `aspen`, `monarch` and `cooper`. Verify the output is `dist/trailmaps/{aspen,monarch,cooper}.html`, each with its own cards prerendered.
- [x] 6.4 Change `src/trailmaps.js` and `src/resort-trailmaps.js` into processed scripts. Search now toggles `hidden` on the prerendered cards and updates the count and empty state, and the viewer pages through the visible cards. Verify search, the empty state and viewer paging work in `astro preview`.
- [x] 6.5 Delete `trailmaps.html`, `trailmaps/*.html` and the client-side `renderMapCards` path. Verify the parity check shows no unintended differences for the 4 trail map pages.

## 7. Sitemap, share image and headers

- [x] 7.1 Add `src/pages/sitemap.xml.js`. It emits `/sitemap.xml` from the page registry, with the same schema, `lastmod`, `changefreq` and `priority` as today. Verify that the `<loc>` set equals the set of canonical URLs, and that two consecutive builds produce byte-identical sitemaps.
- [x] 7.2 Create the 1200x630 `public/og-image.png` from the ridge art and site name, and commit it. Verify it is exactly 1200x630, and that every page's `og:image` and `twitter:image` point to it.
- [x] 7.3 Update `public/_headers`:
  - add `/_astro/*` as immutable
  - remove the `/trailmaps/*` immutable rule
  - keep the HTML must-revalidate rules, the `/images/*` and `/fonts/*` rules, and the security headers unchanged

  Verify by reading the file that no rule which matches an `.html` path sets `immutable`.
- [x] 7.4 Update `README.md`: the Astro stack, the dev, build and preview commands, the removal of `npm run thumbs`, where trail map images now live, and the inline-script check. Verify every command listed in the README runs as documented.

## 8. Integration verification

- [x] 8.1 Run `npm run build` and the parity check against the baseline. Verify that the only differences are the intended ones:
  - generated counts
  - `og-image` now resolves
  - asset URLs under `/_astro/`
  - trail map grids now in the HTML
- [x] 8.2 Deploy a Netlify deploy preview. Run `scripts/url-matrix.js` against it and diff the result with `.baseline/url-matrix.txt`. Verify the only difference is `/og-image.png` going from 404 to 200.
- [x] 8.3 On the deploy preview, check response headers for `/`, `/trailmaps/aspen.html`, an `/_astro/` asset and `/sitemap.xml`. Verify the CSP header is unchanged, the HTML pages and the sitemap must revalidate, and the assets are immutable.
- [x] 8.4 On the deploy preview, load every page in a browser and use all the interactive features. Verify no CSP violations or console errors.
- [x] 8.5 Compare screenshots of the preview and production in light and dark themes, at about 400px and desktop widths. Verify there's no unintended visual drift.

## Workflow follow-up

- Merge and deploy to production. In Search Console, use URL Inspection (live test) on `/`, `/trailmaps.html` and `/trailmaps/aspen.html`, and resubmit `/sitemap.xml`.
- Monitor the Search Console Pages and Performance reports for 2–4 weeks. If a regression shows up, use Netlify instant rollback.
- Archive `migrate-to-astro` so the `site-rendering` and `seo-metadata` specs exist before applying `add-resort-pages`.
