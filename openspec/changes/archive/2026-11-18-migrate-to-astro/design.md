# Design

## Context

See proposal.md for the reasons behind this change. Current facts that shape the approach:

- **Hosting is Netlify, static only.** There is no `netlify.toml` or `_redirects`. `public/_headers` sets the security headers and cache rules.
- **Netlify adds URL variants of its own.** It serves `/trailmaps` (no extension) as 200 with the same content as `/trailmaps.html`. It 301-redirects `/trailmaps/` → `/trailmaps`, `/trailmaps/aspen/` → `/trailmaps/aspen` and `/index` → `/`. `www` and `http` 301 to `https://uphillskico.com/`.
- **The URLs declared to Google are consistent.** The sitemap, the canonical tags and the internal links all use `/`, `/trailmaps.html` and `/trailmaps/{aspen,monarch,cooper}.html`, and all of these return 200. Search Console has sent emails about redirects, so any new redirect or URL change counts as a regression risk.
- **The CSP header (`script-src 'self'`) blocks any inline executable script.** The existing inline `application/ld+json` blocks aren't executed, so the CSP doesn't apply to them.
- **A live cache bug.** The `/trailmaps/*` rule (one-year `immutable`) also matches `/trailmaps/aspen.html` and the other pages, which are currently served as `immutable`.
- **No image-search traffic.** Search Console shows 0 Image search traffic for trail map images.
- **Astro version.** Astro 7.4.12 is the latest. It needs `vite ^8.3.6` and Node ≥22.23, which fits the project's Node 24.

## Goals / Non-Goals

**Goals:**
- **No Search performance regression.** Indexable URLs, canonical tags and the sitemap location stay the same, and no redirects are added.
- **All page content is in the built HTML,** including the trail map grids.
- **Data-derived SEO values are computed** from `resorts.json` and the trail map data.
- **The existing CSP header keeps working** without being loosened.

**Non-Goals:**
- **Cleaning up Netlify's extensionless variants and trailing-slash 301s.** They exist today, they're covered by canonical tags, and changing them is a separate decision.
- **The dark-mode flash on load.** An existing pre-paint theme flash isn't addressed, because it would need an inline script plus a CSP hash.
- **Astro's `<ClientRouter />` view transitions.** Not adopted. The existing same-document `startViewTransition` filtering is kept.

## Decisions

### D1. Static output, no adapter
Use Astro's default static (prerendered) output. Every page is built once per deploy. No content changes between requests, so on-demand SSR would add a runtime with nothing to gain.
- **Rejected:** SSR or hybrid with `@astrojs/netlify`, because it adds a runtime, cold starts and a dependency for no benefit.

### D2. Keep every URL unchanged: `build.format: 'file'`, `trailingSlash: 'never'`
Astro's default `'directory'` format would change every URL (`/trailmaps.html` → `/trailmaps/`), which forces redirects for the whole site. With `'file'`, these sources produce the same paths as today:
- `src/pages/index.astro` → `index.html`
- `src/pages/trailmaps.astro` → `trailmaps.html`
- `src/pages/trailmaps/[resort].astro` → `trailmaps/{aspen,monarch,cooper}.html`, via `getStaticPaths()` over the multi-map resorts in the trail map data

`trailingSlash: 'never'` makes the dev server behave like Netlify. Set `site: 'https://uphillskico.com'` so canonical and absolute URLs are built from one place.
- **Rejected:** directory format with 301s. It means a site-wide URL migration, slower re-indexing and the redirect reports already being emailed.
- **Rejected:** `'preserve'`. It gives the same output here, but `'file'` states the intent more clearly.

### D3. Custom `sitemap.xml` endpoint instead of `@astrojs/sitemap`
`@astrojs/sitemap` writes `sitemap-index.xml` and `sitemap-0.xml`, which would change the sitemap URL submitted to Search Console and listed in `robots.txt`. Instead, a static endpoint `src/pages/sitemap.xml.js` emits `/sitemap.xml` with the same schema as today:
- Its URL list comes from one shared page registry, the same one that drives canonical tags. That guarantees the sitemap and canonical URLs match.
- `lastmod` stays an explicit, intentionally edited value per page in that registry. A build-time date would change on every deploy, and Google ignores `lastmod` values that aren't accurate.
- `changefreq` and `priority` are kept to minimise the diff, even though Google ignores them.
- **Rejected:** `@astrojs/sitemap` with a renamed output. Renaming files after the integration runs is fragile.

### D4. Page metadata through a shared layout and a page registry
`src/layouts/Base.astro` owns the head: critical CSS, font preload, title, description, canonical, Open Graph and Twitter tags, manifest, theme-color, and the header and footer. Each page passes props to it.
- **Data-derived values are computed:** resort counts in titles and descriptions, the top-3 ItemList JSON-LD (from `rank`) and the trail map counts.
- **Editorial copy stays hand-written:** the hero and intro text, and the FAQ JSON-LD answers.
- JSON-LD is serialised with `JSON.stringify` from objects, not hand-written JSON, and rendered as a `type="application/ld+json"` script with `is:inline` so Astro leaves it as-is.

### D5. Templates replace string generators; incremental port of the ridge
- **Tickets.** `generateTicket()` becomes `ResortTicket.astro`, plus small badge, season-stamp and barcode components or helpers.
- **The ridge** (`generateRidge`, about 330 lines of deterministic SVG geometry) is first rendered by calling the existing function through `<Fragment set:html>` at build time. It can become a component later. This keeps a byte-identical ridge while the rest moves, and turning it into a component isn't needed for SEO.
- **`src/shared.js` keeps the helpers the client still uses** (`escapeHtml`, `getRankBadge`, `getPassLabel`, `slugify`) for autocomplete rendering.
- **`scripts/generate-static.js` and the `STATIC_*` markers are deleted.**

### D6. Client behaviour as processed scripts, no UI framework
`main.js`, `src/trailmaps.js`, `src/resort-trailmaps.js` and their imports (`hero.js`, `skier3d.js`, `viewer.js`, `ui.js`, `utils.js`) become `<script>` tags in pages or components that import the existing modules. Astro bundles them into `/_astro/*.js`.
- **Trail map grid:** `renderMapCards` initially rendered the grid client-side. The grid is now prerendered, so on the trail map pages the client only toggles `hidden` on cards for search, matching the pattern the home page already uses.
- **Rejected:** React, Svelte or Preact islands. The code is plain DOM, and hydration runtimes add JS and inline bootstrap scripts that the CSP would block.

### D7. CSP: keep the header, forbid inline executable scripts, enforce with a build check
Astro inlines small processed scripts ("If the script is small enough, Astro will inline it directly into the HTML"), and `script-src 'self'` would silently block them.
- **Spike first.** Find the setting that stops script inlining in Astro 7. The first candidate is `vite.build.assetsInlineLimit`. Keeping every page script importing shared modules is a fallback, but not a guarantee.
  - **Spike result (Astro 7.4.12):** by default a tiny processed `<script>` is emitted inline as `<script type="module">…</script>`. Setting `vite.build.assetsInlineLimit: 0` in `astro.config.mjs` stops this: the same script is emitted to `/_astro/*.js` and loaded with `src=`. Astro applies Vite's asset inline limit to hoisted scripts, so this one setting covers every page script.
- **Then add a post-build check** that scans `dist/**/*.html` and fails the build on any `<script>` without `src` whose type isn't `application/ld+json`.
- **Styles:** `style-src 'unsafe-inline'` already allows inlined styles, so `build.inlineStylesheets` can stay at its default.
- **Rejected:** `security.csp`. It delivers the policy as a `<meta>` tag, and the `_headers` policy would still be enforced alongside it, so the header would have to be loosened anyway. It also doesn't run in dev.

### D8. Images through `astro:assets` (Astro's recommended method)
- **Trail maps.** Move `public/trailmaps/*.{webp,avif}` to `src/assets/trailmaps/`.
  - Thumbnails render with `<Image>` at width 600. This replaces `public/trailmaps/thumbs/` and `scripts/generate-thumbs.js`.
  - Full-size URLs for ticket links and the viewer come from `getImage()` at build time, keeping the source format and dimensions so the maps stay legible.
    - **As implemented:** full-size URLs use the imported image's own `src`, which emits the original file unmodified to `/_astro/<name>.<hash>.<ext>`. `getImage()` would re-encode through sharp even with the same format and size, and that second lossy pass is exactly what hurts dense maps. Same format, same dimensions, byte-identical pixels (all 30 verified with `cmp`).
  - **Viewer data.** The client can no longer derive image URLs from file names, because they're hashed. The URLs are resolved at build time and read from the page: ticket trail map links carry their resort's maps (`name`, `rank`, `src`, `thumb`) as JSON in `data-maps`, plus `data-map-index`. On the trail map pages the viewer reads the prerendered cards. A `<script type="application/json">` block was avoided because the D7 inline-script check only allows `application/ld+json`.
  - `resorts.json` keeps its `trailMap` paths. A build-time lookup (`import.meta.glob` over `src/assets/trailmaps/*`) resolves image paths to processed URLs. `.html` trail map paths pass through unchanged.
- **Decorative images referenced from markup** (pass logos, the ridge's `peak-texture.png`) move to `src/assets` and are imported.
  - **As implemented:** only `peak-texture.png` is referenced from markup. It moved to `src/assets/images/` and is passed to `generateRidge()`, and `scripts/generate-texture.js` now writes there. `epic-logo.webp` and `ikon-logo.webp` aren't referenced anywhere, so they stay in `public/images/` with their URLs unchanged; deleting them is a separate cleanup.
- **Assets referenced from CSS** (`/images/topo.svg`) may stay in `public/`.
- **Stays in `public/`** because the URLs must not change: fonts, favicon, manifest, `robots.txt`, `_headers` and `og-image.png`.
- **Accepted cost:** the raw image URLs (`/trailmaps/Vail.avif`) become hashed `/_astro/...` URLs, so outside hotlinks to those files will 404. Search Console shows 0 image-search traffic, and no indexable page URL changes.
- **Viewer stylesheet.** `viewer.js` loads `viewer.css` itself (a `?url` import plus a `<link>`, awaited at module top level). A plain CSS import there would make Astro add a render-blocking `<link>` to every page that can open the viewer. The baseline loaded it only on first open.
- `vite-plugin-image-optimizer` is removed. `sharp` stays as Astro's default image service. `scripts/generate-texture.js` stays a manual script.

### D9. One static Open Graph image
Add one 1200x630 PNG at `public/og-image.png`, the URL every page already references. It uses the site's ridge art and name. All pages (home and trail maps) reference it through the layout. It's a fixed public URL so social platform caches stay valid. Generating it is a one-off: it can be made with sharp from the ridge SVG or by hand, and the PNG is committed.

### D10. Build, minify and tooling
- **HTML compression:** `compressHTML: true`, which the docs describe as lossless whitespace removal. It replaces `vite-plugin-minify`. JS and CSS are minified by Astro/Vite.
- **Build target:** `vite.build.target: 'es2025'` is kept.
- **npm scripts:** `dev` → `astro dev`, `build` → `astro build` plus the D7 check, `preview` → `astro preview`. `prebuild` is removed. `texture` stays.
- **Lint and format:** add `eslint-plugin-astro` and `prettier-plugin-astro`.
- **Netlify:** the publish dir stays `dist`, and the build command becomes `npm run build`.

### D11. `_headers` updated for the new output
- Add `/_astro/*` as `immutable`.
- Remove the `/trailmaps/*` immutable rule, since no images live there any more. That fixes the current bug where `/trailmaps/*.html` is served `immutable`.
- Keep the HTML must-revalidate rules and the security headers unchanged.

## Risks / Trade-offs

- **[Any indexable URL, canonical or sitemap entry changes]** → Before switching, run a parity script that compares the old and new `dist/`:
  - the set of `.html` paths
  - per page: `<title>`, meta description, canonical, `robots`, `h1`/`h2` text, JSON-LD and visible ticket text
  - `sitemap.xml` `<loc>` values

  Any difference must be intended (such as the generated counts).
- **[A small script gets inlined and the CSP silently blocks it]** → The D7 spike plus a post-build check that fails CI.
- **[Netlify behaves differently from `astro preview` on extensionless and slash URLs]** → Check the URL matrix (`/`, `/index.html`, `/trailmaps`, `/trailmaps.html`, `/trailmaps/`, `/trailmaps/aspen`, `/trailmaps/aspen.html`, `/trailmaps/aspen/`, `/index`, `/sitemap.xml`, `/og-image.png`) on a Netlify deploy preview. Status codes and `Location` headers must match production, apart from `/og-image.png`, which goes from 404 to 200.
- **[Visual or behavioural drift after porting]** → Compare screenshots of the preview and production in both themes, at phone and desktop widths. Manually check the filters, autocomplete, ridge jump, 3D skier, viewer and theme toggle.
- **[Re-encoding full-size trail maps lowers legibility]** → Keep the source format and dimensions in `getImage()`, and spot-check the dense maps (Vail, Beaver Creek).
- **[Outside hotlinks to raw map images break]** → Accepted. 0 image-search traffic, and the page URLs are unchanged.
- **[Whitespace compression changes inline text spacing]** → Covered by the visible-text parity comparison.

## Migration Plan

1. Build the Astro version on a branch, then run the parity script and the CSP check locally.
2. Deploy a Netlify deploy preview, then check the URL matrix, headers (CSP and cache) and visuals against production.
3. Merge and deploy to production.
4. In Search Console:
   - Use URL Inspection (live test) on `/`, `/trailmaps.html` and `/trailmaps/aspen.html`.
   - Resubmit `/sitemap.xml`.
   - Watch the Pages and Performance reports for 2–4 weeks.
5. **Rollback:** Netlify instant rollback to the previous deploy. URLs are unchanged, so rolling back has no SEO side effects.

## Open Questions

- ~~What exact Astro 7 setting disables script inlining?~~ Answered by the D7 spike: `vite.build.assetsInlineLimit: 0`.
