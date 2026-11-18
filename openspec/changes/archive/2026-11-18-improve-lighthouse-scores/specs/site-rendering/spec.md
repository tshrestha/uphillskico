# Spec Delta

## MODIFIED Requirements

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
