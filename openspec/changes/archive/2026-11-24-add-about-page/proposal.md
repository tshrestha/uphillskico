# Proposal

## Why

The site gives no answer to "who made this, and why should I trust it?". The footer says every ticket was "checked against each resort's official website", and the lineup is ranked, but no person stands behind either claim. An About page puts a face and a story to the guide, and it explains in the owner's own words how the data is gathered and how the ranking was decided, including the owner's open bias toward Winter Park.

## What Changes

- Add a standalone About page at `/about.html`, built through the shared layout and listed in the page registry, so it gets a canonical URL, a sitemap entry and Lighthouse audit coverage automatically.
- The page shows a portrait photo, the owner's full name and a one-line intro, then four sections in this order:
  1. **Why I built this**: how discovering resort uphill at Winter Park led to the project.
  2. **About me**: Nepal to Maryland to Denver, plus a "Backyard favourites" list.
  3. **On the skin track**: the owner's current uphill season, plus a "My setup" gear list. This section carries a season label so it's never presented as current after the season ends.
  4. **How this guide works**: where the data comes from, how often it's updated, and how the ranking was decided.
- The page copy is approved by the owner and recorded in design.md. It is personal writing, not resort data. It makes no claim about a resort's current policy that contradicts `resorts.json`.
- Add an **About** link to the primary nav and the footer nav on every page.
- Link the home page's lineup rank note to the "How this guide works" section.
- Publish `ProfilePage` structured data naming the owner, with no contact details.
- The page has no contact details. A "Send me a correction" link is added later by `add-feedback-form`.

## Capabilities

### New Capabilities

- `about-page`: The site's About page: its URL, content sections, owner photo, season label on time-bound content, the rule that it shows no contact details, and how other pages link to it.

### Modified Capabilities

- `site-rendering`: "Public page URLs are stable" adds `/about.html` to the URL list.
- `seo-metadata`: adds a requirement for the About page's `ProfilePage` structured data.

## Impact

- **Code**:
  - new `src/pages/about.astro`
  - new About page styles
  - `src/layouts/Base.astro`: nav and footer links, plus a new hero class option
  - `src/data/pages.js`: registry entry
  - `src/pages/index.astro`: rank note link
  - `public/_headers`: cache rule for `/about.html`
- **Assets**: one portrait photo, added under `src/assets/` and processed by `astro:assets`. The original is never copied to `public/`.
- **Every page**: the header and footer change on every page (one new link each), so the parity check must allow for it.
- **Ordering with `add-resort-pages`**: both changes modify the same "Public page URLs are stable" requirement. Whichever is archived second must restate the URL list with both additions.
- **Privacy**: the page publishes the owner's full name, birthplace, city and photo. By design it publishes no email address, birth year or other contact details.
- **Out of scope**: the feedback form (`add-feedback-form`), photo galleries, a per-page share image, and any change to `resorts.json`.
