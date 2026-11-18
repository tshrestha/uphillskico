# accessibility Specification

## Purpose

Defines the accessibility guarantees every public page keeps: controls are named so speech and screen-reader users can find them by what they see, text stays readable against what is actually rendered behind it, and pages pass an automated accessibility audit.

## Requirements

### Requirement: Accessible names include the visible label
Every link or control that shows visible text SHALL have an accessible name that contains that visible text (WCAG 2.5.3 Label in Name). The name SHALL still identify the target and the action.

#### Scenario: Trail map card
- **WHEN** a trail map card shows the rank "1" and the name "Winter Park"
- **THEN** its accessible name contains "1" and "Winter Park" in the order they appear
- **AND** it identifies the link as opening that resort's trail map

#### Scenario: Ridge flag on the home page
- **WHEN** the mountain-range flag shows a resort's rank, name and details
- **THEN** the flag link's accessible name contains that visible text
- **AND** it identifies the link as jumping to that resort

#### Scenario: Control with no visible text
- **WHEN** a link or button shows only an icon or image, such as the theme toggle or the trail map fan on the home page
- **THEN** it keeps a descriptive accessible name

### Requirement: Decorative layers don't sit behind text when inactive
A decorative layer drawn over or behind text SHALL NOT be rendered while it's inactive. For example, the gold contour spotlight in the trail map hero is inactive until the pointer is over the hero. Text contrast SHALL meet WCAG AA against the background actually visible at page load.

#### Scenario: Trail map hero at page load
- **WHEN** a trail map page has loaded and the pointer is not over the hero
- **THEN** the contour spotlight layer is not rendered
- **AND** the hero's breadcrumb, subtitle and header text meet WCAG AA contrast against the hero background

#### Scenario: Pointer over the hero
- **WHEN** a fine-pointer visitor moves the pointer over the trail map hero
- **THEN** the gold contours light up under the pointer as before
- **AND** the spotlight hides again when the pointer leaves the hero

#### Scenario: Touch device
- **WHEN** a trail map page is viewed on a device without a fine pointer
- **THEN** the contour spotlight layer is never rendered

### Requirement: Pages pass the automated accessibility audit
Every public page SHALL score 100 in the Lighthouse accessibility category, on mobile and on desktop. It SHALL have no failing accessibility audits, including audits that carry no score weight, such as `label-content-name-mismatch`.

#### Scenario: Auditing a trail map page
- **WHEN** the Lighthouse accessibility audit runs on `/trailmaps.html` or any resort trail map page
- **THEN** the color-contrast and label-content-name-mismatch audits pass and the category score is 100
