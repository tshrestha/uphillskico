# Uphill Ski Colorado

A guide to uphill skiing policies at Colorado ski resorts.

**Live site:** [uphillskico.com](https://uphillskico.com)

## Features

- Interactive mountain range hero: every peak is a resort, taller peaks have better uphill access (hover, drag, or use arrow keys)
- Search and filter 24+ Colorado ski resorts, with live counts per option
- Filter by pass type (Epic, Ikon, Independent)
- Filter by operational hours access
- Lift-ticket style resort cards with direct links to resort policies
- Zoomable, pannable trail map viewer (pinch, scroll, drag, keyboard)
- "Bluebird" light and "Dawn Patrol" dark themes
- Mobile-friendly design that respects reduced-motion preferences

## Development

Requires Node 24.

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:4321)
npm run dev

# Build for production into dist/, then check that no page has an inline
# script (the Content-Security-Policy only allows scripts from the site itself)
npm run build

# Preview the production build
npm run preview

# Lint and format
npm run lint
npm run fmt

# Regenerate the mountain surface texture (src/assets/images/peak-texture.png)
npm run texture
```

Trail map thumbnails are generated during the build, so there is no separate
thumbnail step any more.

### Where things live

- `src/pages/`: one file per public URL. `index.astro` is `/`, `trailmaps.astro`
  is `/trailmaps.html`, `trailmaps/[resort].astro` is `/trailmaps/<resort>.html`
  and `sitemap.xml.js` is `/sitemap.xml`. The `.html` URLs are kept on purpose
  (`build.format: "file"`), so don't change them.
- `src/data/pages.js`: the page registry. Canonical URLs and the sitemap both
  come from it. Update a page's `lastmod` when its content changes.
- `src/layouts/`, `src/components/`: page shell, lift tickets, map cards.
- `src/*.js`: browser scripts (filters, mountain range, 3D skier, trail map
  viewer), bundled by Astro.
- `src/assets/trailmaps/`: trail map images. Astro serves the originals at
  content-hashed `/_astro/` URLs and generates 600px WebP thumbnails.
  `resorts.json` and `src/trailmaps-data.js` refer to maps by file name.
- `public/`: files served at fixed URLs (fonts, favicon, `_headers`,
  `robots.txt`, `site.webmanifest`, `og-image.png`).

### Formatting `.astro` files

`prettier-plugin-astro` ignores inline whitespace, so it can add visible
spaces between inline elements (an icon and its label, the hero letters). Markup
where that matters is marked `{/* prettier-ignore */}`. Keep those markers when
editing it.

## Tech Stack

- [Astro](https://astro.build/) (static output, no UI framework); vanilla
  JavaScript and hand-written CSS
- [Mona Sans](https://github.com/github/mona-sans) variable font, self-hosted in `public/fonts` (SIL Open Font License)

## Data

Resort data is stored in `resorts.json`. Each resort includes:

- Name and website
- Pass affiliation (Epic/Ikon/Independent)
- Uphill policy details (schedule, cost, access during operations)
- Links to official policy and trail maps
