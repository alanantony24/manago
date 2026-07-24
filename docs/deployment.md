# Deploying ManaGo

CI checks every pull request. Vercel builds a preview for that PR. Merging to
`main` deploys production.

## Prerequisites

- Node.js 22+ and npm 11
- Existing Supabase project (use `supabase/setup.sql` only as a helper, not a
  full schema dump)
- Mapbox public token
- Clerk publishable + secret keys

## Environment variables

| Variable | Where | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | GitHub **variable** + Vercel | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | GitHub **secret** + Vercel | Public anon key |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | GitHub secret + Vercel | Restrict to your domains |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | GitHub secret + Vercel | Public |
| `CLERK_SECRET_KEY` | GitHub secret + Vercel | Server only |
| `SUPABASE_SERVICE_ROLE_KEY` | **Vercel only** (Preview + Production) | Never put in GitHub Actions or the browser |

Optional Clerk path hints (also set in `ClerkProvider`): see `.env.example`.

Protect `main` so PRs require the **Quality, build, and performance** check.

## Facility photos

Demo photos live in Supabase Storage (`addlocation-images/facility-photos/…`),
not in git. User-submitted photos use the same bucket.

1. `npm run upload-photos` — push / refresh demo assets
2. `npm run seed` — assign Storage URLs onto facilities

Local `public/facility-photos` is an optional cache and is gitignored.

## Before going public

1. In the Supabase SQL editor, run `supabase/housekeeping_secure.sql`.
2. Confirm anon/authenticated roles cannot insert, update, or delete app tables.
3. Confirm bucket `addlocation-images` denies public uploads (public read is fine).

## Vercel setup

1. Import the GitHub repo as a Next.js project.
2. Set production branch to `main`.
3. Add the env vars above for Preview and Production.
4. Deploy, then restrict the Mapbox token to the Vercel domains.

### Public access (required for Clerk)

If **Vercel Deployment Protection / SSO** is on, anonymous visitors (and Clerk
widgets) break — blank sign-in / register forms.

1. Vercel → **Settings → Deployment Protection** → Production = **None**
2. Clerk → add the `*.vercel.app` (and custom) host under allowed origins /
   redirect URLs, plus `http://localhost:3000`
3. Confirm sign-in path `/sign-in` and sign-up path `/register`

## Release checklist

- [ ] `npm run ci` passes
- [ ] `/nearby` loads facilities and the map over HTTPS
- [ ] Sign-in, contribute, review, and profile work when signed in
- [ ] Anonymous table/storage writes are denied
- [ ] No new errors in browser or Vercel function logs

## Rollback

1. Vercel → Deployments → promote the last good production deploy.
2. Confirm `/nearby`, `/help`, and sign-in.
3. Revert the bad commit on GitHub with a new PR so git matches what’s live.

App rollback does not undo Supabase data or schema changes.
