# Proposal

## Why

The site builds with Vite, and a script (`scripts/generate-static.js`) injects resort HTML into `index.html` with regex markers. That script rewrites a checked-in source file on every build. The trail map pages (`trailmaps.html`, `trailmaps/{aspen,monarch,cooper}.html`) render their map grids only in client-side JavaScript, so crawlers get empty grids. SEO metadata is maintained by hand and has drifted from the data:
- The "24 resorts" count is typed by hand in the meta tags.
- The ItemList JSON-LD is written by hand.
- `sitemap.xml` has hand-edited `lastmod` dates.
- `og:image` points to `/og-image.png`, which doesn't exist.

Moving to Astro (latest, 7.x) in its default static output mode keeps the site fully static. All of its HTML would come from components and data instead of string injection. That also makes per-resort pages (follow-up change `add-resort-pages`) cheap to add.

This change is a **parity migration**. Visitors see the same pages at the same URLs with the same behavior. The only differences are the SEO fixes above, which are possible because the HTML is now generated.

**Hard constraint: no Search performance regression.** Search Console has already sent emails about redirects. The migration must not change any indexable URL, canonical URL or the sitemap location, and must not add redirects.

## What Changes

- Replace the Vite multi-page setup with an Astro project using static output (no SSR, no server adapter).
- Port `index.html`, `trailmaps.html` and `trailmaps/{aspen,monarch,cooper}.html` to Astro pages that share a layout (head, critical CSS, font preload, theme handling, header and footer).
- Turn the HTML-string generators in `src/shared.js` (`generateTicket`, `generateRidge`, badges, season stamp, barcode) into Astro components that read `resorts.json` at build time. Remove `scripts/generate-static.js` and the `STATIC_*` marker blocks.
- Render the trail map grids at build time from `src/trailmaps-data.js`. Client JS keeps only search and filtering, and the zoomable viewer.
- Keep the existing client behavior (hero ridge and 3D skier, filters, autocomplete, view transitions, theme toggle, trail map viewer) as browser scripts. Don't add a UI framework.
- Generate SEO metadata from data: resort counts in titles, descriptions and Open Graph tags; ItemList JSON-LD; and the sitemap. Editorial copy, including the FAQ JSON-LD answers, stays hand-written.
- Fix the broken Open Graph image (`/og-image.png` currently returns 404) by adding one static 1200x630 share image at that URL, used by every page.
- Keep the current public page URLs (`/`, `/trailmaps.html`, `/trailmaps/<resort>.html`) and `/sitemap.xml` exactly as they are, with no new redirects. Fixed-URL files (fonts, favicon, `_headers`, `robots.txt`, `site.webmanifest`, `og-image.png`) stay in `public/`.
- Process trail map images (full-size and thumbnails) and markup-referenced decorative images with Astro's recommended `astro:assets` pipeline. This replaces `scripts/generate-thumbs.js` and the `public/trailmaps/thumbs/` copies. Raw image file URLs become hashed `/_astro/...` URLs, which is accepted because Search Console shows no image-search traffic. Page URLs don't change.
- Fix the `_headers` cache rule that currently serves `/trailmaps/*.html` pages with a one-year `immutable` cache.
- Keep the security headers working: the CSP `script-src 'self'` must still hold, so the built output must not depend on inline scripts that the policy blocks.
- Replace `vite-plugin-minify` with Astro's built-in HTML compression. Remove `vite-plugin-image-optimizer`; `astro:assets` with sharp replaces it. Update the `package.json` scripts (`dev`, `build`, `preview`).

## Capabilities

### New Capabilities

- `site-rendering`: How the site's pages are produced. Every page is prerendered at build time from `resorts.json` and the trail map data, so all content is in the served HTML before any JavaScript runs. The public URLs and the client-side behavior that enhances the prerendered content are part of this capability.
- `seo-metadata`: What each page tells search engines and social platforms (title, description, canonical URL, Open Graph and Twitter tags, JSON-LD structured data, sitemap, robots). It also requires that data-dependent values come from the source data, not hand-maintained copies.

### Modified Capabilities

_None. `openspec/specs/` has no existing capabilities._

## Impact

- **Code**:
  - `index.html`, `trailmaps.html` and `trailmaps/*.html` become Astro pages and components.
  - `main.js` and `src/*.js` move into component or page scripts.
  - `src/shared.js` HTML generators become components.
  - `scripts/generate-static.js` and `scripts/generate-thumbs.js` are removed.
  - `scripts/generate-texture.js` is kept as a manual script.
  - `public/trailmaps/` images move to `src/assets/trailmaps/`.
- **Config**: `vite.config.js` is replaced by `astro.config.mjs`. `package.json` scripts and dependencies change (add `astro`; drop direct `vite`, `vite-plugin-minify` and `vite-plugin-image-optimizer`). `eslint.config.js` and Prettier need Astro support.
- **Output**: `dist/` keeps the same HTML page paths and `/sitemap.xml`. JS, CSS and processed images move under `/_astro/`, and the `_headers` cache rules are updated to match.
- **Hosting**: Still a static host with no runtime. Deploy settings (build command, output dir) may need a small update.
- **Data**: `resorts.json` and `src/trailmaps-data.js` are unchanged, apart from possibly making trail map data easier to import at build time. No resort content is added or changed.
- **Out of scope**: per-resort pages and new URLs (covered by `add-resort-pages`), visual redesign, content changes.
