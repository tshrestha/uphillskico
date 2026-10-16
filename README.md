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

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Regenerate trail map thumbnails (also runs on build)
npm run thumbs
```

## Tech Stack

- Vanilla JavaScript and hand-written CSS (no UI framework)
- [Vite](https://vitejs.dev/)
- [Mona Sans](https://github.com/github/mona-sans) variable font, self-hosted in `public/fonts` (SIL Open Font License)

## Data

Resort data is stored in `resorts.json`. Each resort includes:

- Name and website
- Pass affiliation (Epic/Ikon/Independent)
- Uphill policy details (schedule, cost, access during operations)
- Links to official policy and trail maps
