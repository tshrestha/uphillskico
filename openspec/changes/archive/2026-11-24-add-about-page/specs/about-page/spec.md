# Spec Delta

## Purpose

Defines the site's About page: who runs the guide and why, how the guide's data is gathered and ranked, and how the page keeps personal, time-bound content honest without exposing the owner's contact details.

## ADDED Requirements

### Requirement: About page is served at a stable URL
The site SHALL serve an About page at `/about.html` as prebuilt static HTML, rendered through the shared site layout with the same header, footer and theme toggle as every other page. All of its text and its portrait SHALL be in the served HTML, without running scripts.

#### Scenario: About page without JavaScript
- **WHEN** `/about.html` is requested and the response HTML is read without running scripts
- **THEN** it contains the owner's name, the portrait, and every section heading and paragraph of the page

### Requirement: About page content and order
The About page SHALL open with a header showing the owner's portrait, full name and a one-line intro. Below it, the page SHALL show these sections in order: "Why I built this", "About me", "On the skin track" and "How this guide works". The page SHALL have exactly one `h1`, the owner's name, and each section SHALL have its own heading.

#### Scenario: Section order
- **WHEN** the About page's headings are read in document order
- **THEN** they are the owner's name (`h1`), followed by "Why I built this", "About me", "On the skin track" and "How this guide works"

#### Scenario: Supporting lists
- **WHEN** the "About me" and "On the skin track" sections are read
- **THEN** "About me" includes a "Backyard favourites" list and "On the skin track" includes a "My setup" list, each marked up as a list

#### Scenario: Linkable guide section
- **WHEN** `/about.html#how-this-guide-works` is opened
- **THEN** the page scrolls to the "How this guide works" section

### Requirement: Owner portrait is optimised and described
The portrait SHALL be served as a processed image in a modern format, at sizes that fit its displayed size, with declared width and height. It SHALL have alt text naming the owner. The served image SHALL carry no camera or location metadata.

#### Scenario: Portrait markup
- **WHEN** the About page HTML is read
- **THEN** the portrait `<img>` has width, height, a `srcset` with at least two widths and alt text containing the owner's name

#### Scenario: Metadata stripped
- **WHEN** each served portrait file is inspected
- **THEN** it has no EXIF GPS, camera model or capture date fields

### Requirement: Time-bound section is labelled with its season
The "On the skin track" section SHALL show the season it was written for. While that season is the guide's current season, the label SHALL read as current ("2026–27 season"). Once the guide's current season moves on, the label SHALL say the section was written in that earlier season, so personal news is never presented as current.

#### Scenario: Written for the current season
- **WHEN** the section's season equals the guide's current season
- **THEN** its label reads "<season> season"

#### Scenario: Current season has moved on
- **WHEN** the guide's current season is changed to a later season without editing the section
- **THEN** its label reads "Written in <season>" with the section's original season

### Requirement: About page shows no contact details
The About page SHALL NOT show or contain the owner's email address, phone number, street address or birth year, in its visible text, link targets, metadata or structured data.

#### Scenario: No email address in the build
- **WHEN** the built `/about.html` is searched for `mailto:` links and email-address patterns
- **THEN** neither is found

### Requirement: Personal copy stays consistent with resort data
Any statement on the About page about a resort's uphill policy (price, hours or access) SHALL be phrased as the owner's past experience or opinion. It SHALL NOT state a current-season policy fact that differs from that resort's entry in the resort data.

#### Scenario: Winter Park price in the story
- **WHEN** the About page mentions what Winter Park's uphill access cost
- **THEN** it is told as part of how the owner got started, not as the current season's price

### Requirement: Every page links to the About page
Every page SHALL link to `/about.html` from the primary nav and the footer nav, with the visible label "About". On the About page itself, the primary nav link SHALL be marked as the current page.

#### Scenario: Nav link on other pages
- **WHEN** the home page, `/trailmaps.html` or a resort trail map page is read
- **THEN** both the primary nav and the footer nav contain a link labelled "About" to `/about.html`

#### Scenario: Current page marking
- **WHEN** `/about.html` is read
- **THEN** its primary nav "About" link has `aria-current="page"`, and no other primary nav link does

### Requirement: Ranking note links to the ranking explanation
The home page's lineup ranking note SHALL link to the "How this guide works" section of the About page.

#### Scenario: Following the ranking note
- **WHEN** a visitor activates the link in the lineup's ranking note
- **THEN** `/about.html#how-this-guide-works` opens
