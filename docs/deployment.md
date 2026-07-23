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

### Production URL (`manago.vercel.app`)

`manago.vercel.app` only works if it is assigned to **this** Next.js ManaGo
project in Vercel → **Settings → Domains**.

If that hostname currently opens a different “React App” (or anything that is
not ManaGo), another Vercel project owns the name. Remove the domain from that
other project first, then add `manago.vercel.app` to ManaGo’s Production
domains.

Also:

1. Disable **Deployment Protection / Vercel Authentication** on Production if
   you want the public internet to open the app without a Vercel login.
2. Add the production host to Clerk’s allowed origins / redirect URLs.
3. Restrict the Mapbox token to that host.

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
