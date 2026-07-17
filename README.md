# ManaGo!

ManaGo! helps you find nearby public amenities in Singapore — **water coolers**,
**toilets with bidets**, and **nursing rooms**. It shows them on a map and in a
distance-sorted list, so you can quickly find the closest one and get directions.

## Features

- **Map view** — see amenities around you on an interactive Mapbox map, centered
  on your current location.
- **Nearby list** — amenities sorted by how close they are to you.
- **Search & filter** — search by name/address and filter by amenity type.
- **Facility details** — a detail page for each place with tags, notes, and a
  "Navigate" button that opens Google Maps directions.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + React
- [Tailwind CSS](https://tailwindcss.com) with [shadcn/ui](https://ui.shadcn.com) components
- [Supabase](https://supabase.com) (Postgres) for storing facilities
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) for the map

## Getting started

Use Node.js 22 or newer and npm 11. This repository uses npm and
`package-lock.json`; do not introduce a second package-manager lockfile.

1. Copy `.env.example` to `.env.local` and fill in the public Supabase and
   Mapbox values.

2. Install dependencies:

```bash
npm ci
```

3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The home page redirects to
`/nearby`, which is the main screen.

> Without Supabase credentials the app still runs, but the list will be empty.

## Loading data (optional)

The facility data lives in `data/facilities.json`. To load it into Supabase:

1. Use an existing Supabase project with the current ManaGo schema.
2. Set `SUPABASE_SERVICE_ROLE_KEY` locally for the seed command only.
3. Seed the database:

```bash
npm run seed
```

`npm run clean-data` re-processes the raw dataset (tidies names, addresses, and
notes) and rewrites `data/facilities.json`.

> `supabase/setup.sql` is not a complete fresh-project migration and must not
> be run against production as a deployment step. It assumes existing tables
> and needs to be replaced by a migration generated from the live schema.

## Checks and deployment

Run the same quality checks used by GitHub Actions:

```bash
npm run ci
```

After a production build, `npm run lighthouse` starts the built app and audits
the `/nearby` and `/help` routes. Reports are written to `.lighthouseci/`.

Deployment uses GitHub Actions for CI and Vercel for preview and production
deployments. See [docs/deployment.md](docs/deployment.md) for environment
configuration, branch protection, release checks, and rollback instructions.

## Folder structure

```
manago/
├─ data/
│  └─ facilities.json          # The amenity dataset (source data for seeding)
├─ public/                     # Static assets (e.g. fallback facility photo)
├─ scripts/                    # One-off Node scripts for preparing data
│  ├─ clean-facilities.mjs     # Cleans/normalizes the raw dataset
│  ├─ facility-data-utils.mjs  # Helpers used by the data scripts
│  └─ seed-facilities.mjs      # Loads data/facilities.json into Supabase
├─ supabase/                   # SQL to set up the database schema
│  ├─ setup.sql
│  └─ add_external_id.sql
└─ src/
   ├─ app/                     # Next.js App Router pages
   │  ├─ page.tsx              # Home — redirects to /nearby
   │  ├─ layout.tsx            # Root layout (fonts, global styles)
   │  ├─ globals.css           # Tailwind + theme variables
   │  ├─ nearby/               # Main screen: map + searchable facility list
   │  │  ├─ page.tsx           # Loads facilities from Supabase (server)
   │  │  └─ components/        # NearbyView, FacilityMap, FacilityCard
   │  └─ facilities/[id]/      # Detail page for a single facility
   ├─ components/              # Shared UI
   │  ├─ ui/                   # shadcn/ui primitives (Button, Input, etc.)
   │  ├─ brand-logo.tsx
   │  ├─ facility-tag-pill.tsx
   │  └─ manago-pin-icon.tsx
   ├─ lib/                     # Reusable, non-UI logic
   │  ├─ supabase/             # Supabase client (browser + server)
   │  ├─ facility-helpers.ts   # Turns raw facility data into display values
   │  ├─ geo.ts                # Distance calculation + formatting
   │  ├─ fonts.ts              # Brand font
   │  ├─ mock-reviews.ts       # Placeholder reviews for the detail page
   │  └─ utils.ts              # cn() class-name helper
   └─ types/
      └─ facility.ts           # Shared TypeScript types
```

### How the pieces fit together

- A page in `src/app/` (like `nearby/page.tsx`) runs on the server, fetches
  facilities from Supabase, and passes them to a client component.
- Client components in `components/` render the UI and handle interaction
  (map, search, filtering).
- Pure helpers in `lib/` (distance math, text parsing) keep that logic out of
  the components so it's easy to read and reuse.
