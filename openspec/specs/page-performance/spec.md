# page-performance Specification

## Purpose

Sets loading-performance and audit-quality budgets for every public page, and defines the repeatable Lighthouse audit that checks a deployment against them.

## Requirements

### Requirement: Repeatable page audit
The project SHALL provide one command that runs a Lighthouse audit of every page in the page registry against a given origin. It SHALL cover both mobile and desktop form factors, and SHALL report the performance, accessibility, best-practices and SEO scores plus LCP, TBT and CLS for each page and form factor.

#### Scenario: Auditing production
- **WHEN** the audit command is run with `https://uphillskico.com` as the origin
- **THEN** it audits every path listed in the page registry, on mobile and on desktop
- **AND** it prints one row per page and form factor with the four category scores and the LCP, TBT and CLS values

#### Scenario: Auditing another origin
- **WHEN** the audit command is run with a deploy-preview or local-preview origin
- **THEN** it audits the same registry paths on that origin

#### Scenario: New page registered
- **WHEN** a page is added to the page registry
- **THEN** the next audit run includes it with no change to the audit command

### Requirement: Audit results are medians of repeated runs
The audit SHALL run each page and form factor several times (at least 3) and judge it by the median run, so that a single cold or noisy run neither fails nor passes a page.

#### Scenario: One outlier run
- **WHEN** one of three runs of a page shows a much higher TBT than the other two
- **THEN** the reported result for that page is the median run, not the outlier

### Requirement: Audit enforces the page budgets
The audit SHALL exit with a non-zero status when any page's median result misses a budget, and SHALL name each page, form factor and budget that failed. The budgets are: mobile performance at least 95; mobile LCP at most 2.5 s; CLS at most 0.1; accessibility, best-practices and SEO 100 on mobile and desktop.

#### Scenario: All pages within budget
- **WHEN** every page's median results meet every budget
- **THEN** the audit exits with status 0

#### Scenario: A page misses a budget
- **WHEN** a page's median mobile LCP is 3.1 s
- **THEN** the audit exits with a non-zero status and reports that page, "mobile" and the LCP budget as failed

#### Scenario: Audit cannot run
- **WHEN** no Chrome or Chromium is available, or the origin can't be reached
- **THEN** the audit exits with a non-zero status and an error that says why, without reporting any page as passing

### Requirement: Above-the-fold trail map thumbnails paint without delay
On trail map pages, the thumbnails of the cards visible in the first viewport SHALL NOT be hidden by an entrance animation once loaded. The first card's thumbnail SHALL be requested at high fetch priority. Cards further down the grid MAY keep an entrance animation.

#### Scenario: First card on mobile
- **WHEN** `/trailmaps.html` loads on a mobile viewport
- **THEN** the first card's thumbnail is visible at full opacity as soon as it's decoded
- **AND** its request is made at high priority

#### Scenario: Reduced motion
- **WHEN** a visitor prefers reduced motion
- **THEN** no map card is hidden or offset by an entrance animation
