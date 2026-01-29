# Uphill Ski Colorado

A guide to uphill skiing policies at Colorado ski resorts.

**Live site:** [uphillskico.com](https://uphillskico.com)

## Features

- Search and filter 24+ Colorado ski resorts
- Filter by pass type (Epic, Ikon, Independent)
- Filter by operational hours access
- Direct links to resort policies and trail maps
- Dark/light theme support
- Mobile-friendly design

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
```

## Tech Stack

- Vanilla JavaScript
- [Vite](https://vitejs.dev/)
- [Bootstrap](https://getbootstrap.com/)

## Data

Resort data is stored in `resorts.json`. Each resort includes:

- Name and website
- Pass affiliation (Epic/Ikon/Independent)
- Uphill policy details (schedule, cost, access during operations)
- Links to official policy and trail maps
