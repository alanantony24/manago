# Deploying ManaGo

This is the extended checklist behind the **Deploy to the cloud** section in the
root [README](../README.md).

**Live production:** [https://manago-psi.vercel.app](https://manago-psi.vercel.app)  
**GitHub (public):** [https://github.com/alanantony24/manago](https://github.com/alanantony24/manago)

CI checks every pull request. Vercel builds a preview for that PR. Merging to
`main` deploys production.

## Prerequisites

- Node.js 22+ and npm 11
- Existing Supabase project with the ManaGo schema already applied  
  (`supabase/setup.sql` only adds an optional `external_id` helper for seeding —
  it is **not** a full schema dump)
- Mapbox public access token
- Clerk application with publishable + secret keys

## What each cloud service does

| Service | Responsibility |
|---------|----------------|
| **GitHub** | Source of truth; Actions runs lint, `tsc`, `next build`, Lighthouse |
| **Vercel** | Hosts the Next.js app (SSR, server actions, middleware) |
| **Supabase** | Postgres for facilities / reviews / submissions / profiles; Storage for photos |
| **Clerk** | Identity, sessions, protected routes |
| **Mapbox** | Map tiles, geocoding (contribute form), walking directions (`/locate`) |

## Environment variables

| Variable | Where | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | GitHub **variable** + Vercel | Public project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | GitHub **secret** + Vercel | Browser / RSC reads |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | GitHub secret + Vercel | Restrict to your domains |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | GitHub secret + Vercel | Clerk front-end |
| `CLERK_SECRET_KEY` | GitHub secret + Vercel | Server / middleware only |
| `SUPABASE_SERVICE_ROLE_KEY` | **Vercel only** (Preview + Production) | Server actions + seed scripts. Never in GitHub Actions or the browser |

Optional Clerk path hints: see `.env.example` (paths are also set on `ClerkProvider`).

Protect `main` so PRs require the **Quality, build, and performance** check.

## Step-by-step: first Vercel deploy

1. Push this repo to GitHub (already public at `alanantony24/manago`).
2. In Vercel → **Add New Project** → import the repo → framework **Next.js**.
3. Set production branch to **`main`**.
4. Paste all env vars above for **Preview** and **Production**.
5. Deploy and open the assigned `*.vercel.app` URL.
6. Turn off **Deployment Protection** for Production (see below).
7. Register that URL in Clerk and Mapbox.
8. Confirm `/nearby` shows facilities over HTTPS.

## Facility photos

Demo photos live in Supabase Storage (`addlocation-images/facility-photos/…`),
not in git. User-submitted photos use the same bucket (flat `timestamp-name` keys).

1. `npm run upload-photos` — upload / refresh demo assets  
2. `npm run seed` — assign Storage URLs onto facilities  

Local `public/facility-photos` is an optional cache and is gitignored.

## Before going public (security)

1. In the Supabase SQL editor, run `supabase/housekeeping_secure.sql`.
2. Confirm anon/authenticated roles cannot insert, update, or delete app tables.
3. Confirm bucket `addlocation-images` denies public uploads (public **read** is fine).
4. After lockdown, privileged writes must go through Next.js server actions with
   `SUPABASE_SERVICE_ROLE_KEY`.

## Public access (required for Clerk and graders)

If **Vercel Deployment Protection / SSO** is enabled, anonymous visitors get
blocked and Clerk sign-in / register / profile often show blank forms.

1. Vercel → **Settings → Deployment Protection**
2. Set **Production** protection to **None**
3. Save, then open [https://manago-psi.vercel.app](https://manago-psi.vercel.app)

In Clerk:

1. Add `https://manago-psi.vercel.app` and `http://localhost:3000` under allowed
   origins / redirect URLs
2. Confirm sign-in path `/sign-in` and sign-up path `/register`

## Release checklist

- [ ] `npm run ci` passes on GitHub
- [ ] Live `/nearby` loads facilities and the map over HTTPS
- [ ] Sign-in, contribute, review, and profile work when signed in
- [ ] Anonymous table/storage writes are denied
- [ ] No new errors in browser or Vercel function logs

## Rollback

1. Vercel → Deployments → promote the last good production deploy.
2. Confirm `/nearby`, `/help`, and sign-in.
3. Revert the bad commit on GitHub with a new PR so git matches what’s live.

App rollback does not undo Supabase data or schema changes.
