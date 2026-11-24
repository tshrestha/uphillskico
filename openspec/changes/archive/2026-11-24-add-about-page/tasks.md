# Tasks

## 1. Baseline and page shell

- [x] 1.1 Save a baseline build of the current site (`npm run build`, then copy `dist/` to `.baseline/dist`) for the parity check. Verify the snapshot holds the 5 existing pages and `sitemap.xml`.
- [x] 1.2 Add `/about.html` to `src/data/pages.js` (`changefreq: "yearly"`, `priority: "0.5"`, `lastmod` = ship date). Add `"about-hero"` to `Base`'s `heroClass` options and `"about"` to its `current` options. Verify `npm run build` still passes.
- [x] 1.3 Create `src/pages/about.astro` rendering through `Base` with the metadata from design D5, a compact `about-hero` band and an empty `<main id="main-content">`. Add `src/styles/about.css`, imported only by this page. Verify `dist/about.html` exists, has exactly one canonical (`https://uphillskico.com/about.html`), a title, a description, `index, follow`, and the shared header and footer.

## 2. Portrait

- [x] 2.1 Copy the owner's portrait into `src/assets/images/about/tejen-shrestha.jpeg`. Verify `public/` contains no copy of it.
- [x] 2.2 Render it in the hero with `<Picture>` per design D2 (AVIF and WebP, about 1× and 2× widths, `sizes`, `loading="eager"`, `fetchpriority="high"`, alt "Tejen Shrestha, smiling in the sun") in a fixed square or round frame. Verify the built `<img>` has width, height, a `srcset` with at least two widths and that alt text.
- [x] 2.3 Check the built portrait files for metadata (e.g. `exiftool dist/_astro/tejen-shrestha*` or sharp's `metadata()`). Verify none has GPS, camera model or capture date fields.

## 3. Season stamp

- [x] 3.1 Move the `.season` rules from `src/styles/home.css` to `src/styles/site.css`. Verify the home page tickets look unchanged in light and dark themes, and the parity check shows no ticket text differences.
- [x] 3.2 Add the optional `kind` prop (`"policy"` default, `"written"`) to `SeasonStamp.astro` per design D3. Verify that with `kind="written"`, season `2026-27` renders "2026–27 season", and that temporarily setting `CURRENT_SEASON` to `"2027-28"` renders "Written in 2026–27" with the stale style. Revert the temporary edit. Verify every ticket's stamp text is unchanged.

## 4. Page content

- [x] 4.1 Add the four sections with the approved copy from design.md, word for word: `h2` headings "Why I built this", "About me", "On the skin track" (with `<SeasonStamp season="2026-27" kind="written" />`) and "How this guide works" (`id="how-this-guide-works"`). The "Backyard favourites" and "My setup" lists are `<ul>` lists with visible labels. Verify the heading order in `dist/about.html` matches the `about-page` spec, and that the page reads correctly with scripts disabled.
- [x] 4.2 Style the page in `about.css` using existing colour tokens: a readable column of about 65ch, and the two lists as small side cards on wide screens that stack under their section on narrow ones. Verify there's no horizontal scroll at 400 px and that it reads well in both themes.
- [x] 4.3 Search `dist/about.html` for `mailto:`, `@` email patterns, `1999` and a birth year. Verify none is present.

## 5. Structured data

- [x] 5.1 Add `ProfilePage` JSON-LD through `JsonLd.astro` per design D5, with the `image` URL from `getImage()` on the portrait. Verify the JSON parses, has `@type` `ProfilePage` and `mainEntity.@type` `Person` with `name` and `image`, and has no `email`, `telephone`, `address` or `birthDate`. Verify the `image` URL returns 200 on the deploy preview, and that `npm run build`'s inline-script check still passes.

## 6. Links from the rest of the site

- [x] 6.1 Add an **About** link to `/about.html` in `Base`'s primary nav and footer nav, with `aria-current="page"` when `current === "about"`. Verify the home page, `/trailmaps.html` and `/trailmaps/aspen.html` each have both links, that only the About page marks it as current, and that the header still fits at 400 px wide.
- [x] 6.2 Add a "How I rank them" link to `/about.html#how-this-guide-works` in the home page's lineup rank note. Verify that following it lands on the "How this guide works" heading.

## 7. Headers and URL checks

- [x] 7.1 Add a `/about.html` must-revalidate rule to `public/_headers`, and add `/about.html` and `/about` to `scripts/url-matrix.js`. Verify `dist/_headers` contains the rule.

## 8. Integration checks

- [x] 8.1 Run `node scripts/parity-check.js .baseline/dist dist`. Verify the only differences are the added `/about.html` page and its sitemap `<loc>`.
- [x] 8.2 On the Netlify deploy preview, run `npm run lighthouse -- <preview-url>`. Verify `/about.html` meets every budget (mobile performance ≥ 95, LCP ≤ 2.5 s, CLS ≤ 0.1, accessibility, best practices and SEO 100) and that no existing page regressed. Run `node scripts/url-matrix.js <preview-url> --no-host-variants` and verify `/about.html` returns 200 with no redirect.
- [x] 8.3 Ask the owner to read the deployed preview page against the approved copy. Verify they sign off before merging.

## Workflow follow-up

- Before archiving: if `add-resort-pages` was archived first, update this change's `site-rendering` delta to list the resort page URLs as well (design D7).
- After deploy: resubmit `/sitemap.xml` in Search Console.
- Separately from this change: if Winter Park's official store lists the 2026–27 armband price, update `resorts.json` from that source.
