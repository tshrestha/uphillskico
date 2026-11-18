# seo-metadata Specification

## Purpose

Defines what each page tells search engines and social platforms (titles, descriptions, canonical URLs, share previews, structured data, sitemap and robots directives), and requires values that depend on site data to be computed from that data.

## Requirements

### Requirement: Each page declares its canonical URL
Every page SHALL include exactly one canonical link. It SHALL be the absolute `https://uphillskico.com` URL of that page's own public path, in the same form listed in the sitemap.

#### Scenario: Canonical matches the page's own URL
- **WHEN** any public page is requested at its public URL
- **THEN** its canonical link is that same URL, absolute, on `https://uphillskico.com`

#### Scenario: Variant URL points to the public URL
- **WHEN** a page is reached through a host-generated variant such as `/trailmaps` or `/index.html`
- **THEN** its canonical link is the page's public URL (`/trailmaps.html` or `/` respectively)

#### Scenario: Canonicals unchanged by the migration
- **WHEN** each page's canonical URL in the new build is compared with the previous build
- **THEN** they are identical

### Requirement: Each page has a title and description
Every page SHALL have a non-empty `<title>` and meta description that describe that page. Pages SHALL also declare `index, follow` robots directives.

#### Scenario: Page metadata present
- **WHEN** any public page is requested
- **THEN** it has a non-empty title, a non-empty meta description and a robots meta of `index, follow`

### Requirement: Data-dependent metadata matches the data
Any count or listing in page metadata or structured data that describes site data SHALL be computed from that data at build time. This covers the number of resorts, the number of trail maps and the top-ranked resorts. Hand-written copies SHALL NOT be used.

#### Scenario: Resort count in metadata
- **WHEN** the resort data contains N resorts and the site is built
- **THEN** every title, description and share-preview text that states a resort count states N

#### Scenario: Trail map count in metadata
- **WHEN** the trail map data contains M maps and the site is built
- **THEN** the trail maps page's description states M

### Requirement: Share previews have a working image
Every page SHALL declare Open Graph and Twitter card metadata: title, description, URL, site name and a large image. The image SHALL be a 1200x630 image at a fixed URL that returns HTTP 200, with declared dimensions and alt text.

#### Scenario: Share image resolves
- **WHEN** the `og:image` or `twitter:image` URL of any page is requested
- **THEN** the response is HTTP 200 with a 1200x630 image

#### Scenario: Share metadata present
- **WHEN** any public page is requested
- **THEN** it declares `og:title`, `og:description`, `og:url` equal to its canonical URL, `og:image` with width, height and alt, and `twitter:card` of `summary_large_image`

### Requirement: Home page publishes structured data
The home page SHALL publish valid JSON-LD that describes:
- the website
- an ordered list of the top three resorts by uphill rank, taken from the resort data
- the frequently asked questions shown on the site

#### Scenario: Structured data parses
- **WHEN** the home page's JSON-LD blocks are parsed
- **THEN** each is valid JSON describing a `WebSite`, an `ItemList` and a `FAQPage`

#### Scenario: Ranked list follows the data
- **WHEN** the ranks in the resort data change and the site is rebuilt
- **THEN** the `ItemList` lists the three resorts ranked 1–3, in rank order, with `numberOfItems` matching the number of entries

### Requirement: Sitemap lists the canonical page URLs
The site SHALL serve an XML sitemap at `/sitemap.xml`, the location referenced by `robots.txt`. It SHALL list exactly the canonical URLs of the indexable pages. Each entry's last-modified date SHALL reflect when that page's content last changed, not the build time.

#### Scenario: Sitemap location unchanged
- **WHEN** `/sitemap.xml` is requested
- **THEN** it returns HTTP 200 with an XML sitemap, and `robots.txt` references `https://uphillskico.com/sitemap.xml`

#### Scenario: Sitemap matches canonicals
- **WHEN** the sitemap's `<loc>` values are compared with the canonical URLs of all public pages
- **THEN** the two sets are identical

#### Scenario: Rebuild without content change
- **WHEN** the site is rebuilt and deployed with no change to any page's content
- **THEN** every sitemap `lastmod` value is unchanged
