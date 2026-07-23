# ManaGo

Find nearby public amenities in Singapore — water coolers, toilets with bidets,
and nursing rooms. Browse them on a map, get walking directions, leave reviews,
and contribute new places.

## Stack

- Next.js (App Router) + React
- Tailwind CSS + shadcn/ui
- Supabase (Postgres)
- Mapbox GL JS
- Clerk (auth)

## Setup

Needs **Node.js 22+** and **npm 11**. Use `package-lock.json` only (no second lockfile).

1. Copy `.env.example` to `.env.local` and fill in the values.
2. Install and run:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You’ll land on `/nearby`.

Without Supabase credentials the app still starts, but the facility list is empty.

## Useful commands

| Command | What it does |
|---------|----------------|
| `npm run dev` | Local development server |
| `npm run ci` | Lint + type-check + production build (same as GitHub Actions) |
| `npm run lighthouse` | Performance audit of `/sign-in` and `/help` |
| `npm run seed` | Load `data/facilities.json` into Supabase |
| `npm run clean-data` | Tidy names/addresses in `data/facilities.json` |
| `npm run prune-data` | Heavier dataset cleanup (geocoding; optional) |
| `npm run scrape-photos` | Regenerate local demo photos (gitignored) |

Seeding needs `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. Use an existing
Supabase project that already has the ManaGo schema. Before a public launch,
run `supabase/housekeeping_secure.sql` in the SQL editor so the anon key is
read-only.

## Project layout

```
manago/
├─ data/                 Facility dataset + photo manifest (for seeding)
├─ docs/deployment.md    CI/CD and Vercel checklist
├─ scripts/              Seed / clean / prune / photo helpers
├─ supabase/             SQL helpers (setup + security lockdown)
├─ public/               Static assets
└─ src/
   ├─ app/               Pages and server actions
   ├─ components/        Shared UI
   ├─ lib/               Helpers, validation, Supabase clients
   └─ types/             Shared TypeScript types
```

## Deploy

GitHub Actions runs CI on every PR. Vercel deploys previews and production from
`main`. Full steps: [docs/deployment.md](docs/deployment.md).
