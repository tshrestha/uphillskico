# site-rendering Specification

## Purpose

Defines how the site's pages are produced and served: every page is prebuilt from the resort and trail map data, so its full content is in the served HTML, at a stable set of public URLs, with client-side scripts only enhancing that content.

## Requirements

### Requirement: Pages are prerendered from source data
The site SHALL serve every page as prebuilt static HTML. That HTML is generated from the resort data and trail map data at build time, and SHALL already contain all of the page's content before any client-side script runs.

#### Scenario: Home page content without JavaScript
- **WHEN** the home page is requested and the response HTML is read without running scripts
- **THEN** it contains one resort ticket per resort entry in the resort data, each showing the resort's name, rank, pass, schedule, cost, note (when present), operational-hours access and season stamp
- **AND** it contains the mountain-range graphic with one peak per resort, and the resort count and filter option counts computed from the resort data

#### Scenario: Trail map page content without JavaScript
- **WHEN** `/trailmaps.html` or a resort trail map page is requested and the response HTML is read without running scripts
- **THEN** it contains one card per trail map belonging to that page, each with the map's name, rank and a thumbnail image, plus the trail map count

#### Scenario: Data change updates pages on next build
- **WHEN** a resort entry in the resort data is added, removed or edited and the site is rebuilt
- **THEN** every page showing that resort reflects the change, with no manual edits to page files

### Requirement: Stale season information is labelled
Every page that shows a resort's policy SHALL label that policy with its season, and SHALL say when the season isn't the current guide season, so last-known data is never presented as current.

#### Scenario: Policy confirmed for the current season
- **WHEN** a resort's season equals the current guide season
- **THEN** its ticket shows that season as the confirmed policy season

#### Scenario: Policy from an earlier season
- **WHEN** a resort's season is earlier than the current guide season
- **THEN** its ticket shows "Last confirmed" followed by that season

#### Scenario: Undated policy
- **WHEN** a resort entry has no season
- **THEN** its ticket shows no season label

### Requirement: Public page URLs are stable
The site SHALL serve its pages at exactly these URLs, each returning HTTP 200 from a static file: `/`, `/trailmaps.html`, `/trailmaps/aspen.html`, `/trailmaps/monarch.html`, `/trailmaps/cooper.html` and `/about.html`. It SHALL NOT add redirects for any of them.

#### Scenario: Each public page URL resolves directly
- **WHEN** any of the listed URLs is requested
- **THEN** the response is HTTP 200 with that page's HTML and no redirect

#### Scenario: No URL changes across the migration
- **WHEN** the set of HTML page paths in the new build is compared with the previous build
- **THEN** every previous path is still present and unchanged, and the only new path is `/about.html`

#### Scenario: Host-level URL variants unchanged
- **WHEN** host-generated variants such as `/trailmaps`, `/trailmaps/` or `/trailmaps/aspen/` are requested
- **THEN** each returns the same status code and redirect target as before the change

### Requirement: Client scripts enhance prerendered content
Interactive behaviour SHALL work on top of the prerendered content and SHALL NOT be needed to read it. This covers resort search and filters, autocomplete, the mountain-range jump to a ticket, the 3D skier, the trail map viewer, trail map search and the theme toggle.

#### Scenario: Filtering the resort lineup
- **WHEN** a visitor picks a pass or access filter, or types a search term, on the home page
- **THEN** only matching tickets stay visible, and the result count, the option counts and the highlighted peaks update to match

#### Scenario: Searching trail maps
- **WHEN** a visitor types a search term on `/trailmaps.html`
- **THEN** only the prerendered map cards whose name matches stay visible, the count updates, and an empty state shows when nothing matches

#### Scenario: Opening a trail map
- **WHEN** a visitor activates a trail map link or card
- **THEN** the full-size trail map opens in the zoomable viewer and can be paged through the maps currently visible

#### Scenario: Scripts unavailable
- **WHEN** a page loads and its scripts fail or are disabled
- **THEN** all resort and trail map content is still visible and every link still points to its target

### Requirement: Pages run under the strict script policy
Every page SHALL work under the site's Content Security Policy, which allows scripts only from the site's own origin. No page SHALL contain an inline executable script. Inline structured-data blocks are not executable, so they are allowed.

#### Scenario: No inline executable scripts in the build
- **WHEN** the built HTML pages are scanned
- **THEN** every `<script>` element either has a `src` on the site's origin or has type `application/ld+json`

#### Scenario: No CSP violations at runtime
- **WHEN** each page is loaded in a browser with the production security headers and all interactive behaviour is used
- **THEN** the browser reports no Content Security Policy violations

### Requirement: Cache behaviour separates pages from fingerprinted assets
HTML pages and `/sitemap.xml` SHALL be served with caching that requires revalidation. Scripts, styles and processed images SHALL be served from content-hashed URLs with long-lived immutable caching.

#### Scenario: Page served after a data update
- **WHEN** any HTML page, including `/trailmaps/aspen.html`, is requested
- **THEN** its `Cache-Control` requires revalidation and isn't `immutable`

#### Scenario: Fingerprinted asset served
- **WHEN** a content-hashed script, stylesheet or image is requested
- **THEN** its `Cache-Control` is long-lived and `immutable`

### Requirement: Trail map images are optimised and sized
Each trail map SHALL be served as a full-size image at its original dimensions and format for the viewer. Each SHALL also be served as a reduced-size thumbnail for cards, offered at several widths so the browser picks one close to the card's displayed size. Every thumbnail `<img>` SHALL declare its width and height.

#### Scenario: Thumbnail in a map card
- **WHEN** a trail map card is rendered
- **THEN** its image is a reduced-size thumbnail of that map, with explicit width and height

#### Scenario: Thumbnail widths match the card layout
- **WHEN** a trail map card thumbnail is rendered
- **THEN** its `<img>` has a `srcset` listing at least two thumbnail widths and a `sizes` describing the card's displayed width at each layout breakpoint
- **AND** its `src` is the largest thumbnail width, so browsers without `srcset` support and the viewer's preview still get a usable image

#### Scenario: Two-column mobile grid
- **WHEN** `/trailmaps.html` is viewed on a 412 px-wide screen at device pixel ratio 1.75
- **THEN** the browser downloads a thumbnail narrower than the largest width
- **AND** Lighthouse's mobile image-delivery estimate (`image-delivery-insight`) for the page is under 100 KiB in total (baseline: 1,226 KiB)

#### Scenario: Full-size map in the viewer
- **WHEN** a trail map is opened from a ticket or card
- **THEN** the viewer loads the map at its original dimensions
