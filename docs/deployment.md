# Deploying ManaGo

CI checks every pull request. Vercel builds a preview for that PR. Merging to
`main` deploys production.

## What you need

- Node.js 22+ and npm 11
- Existing Supabase project (do not treat `supabase/setup.sql` as a full schema)
- Mapbox public token
- Clerk publishable + secret keys

## GitHub Actions secrets and variables

**Variable**

- `NEXT_PUBLIC_SUPABASE_URL`

**Secrets**

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

Do **not** put `SUPABASE_SERVICE_ROLE_KEY` in GitHub Actions. Add it only on
Vercel (server-side, Preview + Production).

Protect `main` so PRs require the **Quality, build, and performance** check.

## Facility photos

Demo facility photos live in Supabase Storage (`addlocation-images/facility-photos/…`),
not in git. User-submitted photos use the same bucket (flat `timestamp-name` keys).

- Upload / refresh demo assets: `npm run upload-photos`
- Then seed (assigns random Storage URLs): `npm run seed`
- Local `public/facility-photos` is optional cache only and is gitignored.

## Before going public

1. In the Supabase SQL editor, run `supabase/housekeeping_secure.sql`.
2. Confirm anon/authenticated roles cannot insert, update, or delete app tables.
3. Confirm storage bucket `addlocation-images` denies public uploads (public read is fine).

## Vercel

1. Import the GitHub repo as a Next.js project.
2. Set production branch to `main`.
3. Add these env vars for Preview and Production:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only)
4. Deploy, then restrict the Mapbox token to the Vercel domains.

### Make the app publicly reachable (required for Clerk)

Your ManaGo Vercel project currently redirects anonymous visitors through
**Vercel Deployment Protection / SSO**. That breaks Clerk sign-in, register,
profile, and logout (blank forms / unreachable account pages).

In the Vercel dashboard for this ManaGo project:

1. Open **Settings → Deployment Protection**
2. Set **Production** protection to **None** (disable Vercel Authentication)
3. Save, then open your project domain (the `*.vercel.app` host Vercel assigned)

In the Clerk dashboard:

1. Add that same host under **Allowed origins / redirect URLs**
   (include `http://localhost:3000` for local dev)
2. Confirm sign-in path `/sign-in` and sign-up path `/register`

Until protection is off, only people logged into your Vercel team can open the
site, and Clerk widgets will often fail to render.

## Release checklist

- [ ] `npm run ci` passes
- [ ] `/nearby` loads facilities and the map over HTTPS
- [ ] Sign-in, contribute, review, and profile work when signed in
- [ ] Anonymous table/storage writes are denied
- [ ] No new errors in browser or Vercel function logs

## Rollback

1. In Vercel → Deployments, promote the last good production deploy.
2. Confirm `/nearby`, `/help`, and sign-in.
3. Revert the bad commit on GitHub with a new PR so git matches what’s live.

App rollback does not undo Supabase data or schema changes.
