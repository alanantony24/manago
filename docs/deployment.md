# ManaGo deployment runbook

This project uses a simple CI/CD model:

1. GitHub Actions checks every pull request.
2. Vercel builds a preview URL for that pull request.
3. The team reviews the checks and preview.
4. Merging into `main` triggers the production deployment.

CI means checking the code automatically. CD means turning an accepted commit
into a deployment automatically.

## Prerequisites

- The GitHub repository is `alanantony24/manago`.
- Use Node.js 20.9 or newer and npm. `package-lock.json` is the only lockfile.
- Continue using the existing Supabase project for the first release.
- Obtain a Mapbox public token and restrict it to the deployed domains after
  Vercel assigns them.
- Authentication configuration remains owned by the teammate implementing it.
  Do not claim or publish a local Clerk Keyless configuration.
- CI checks finished application code through `tsconfig.ci.json`; the unfinished
  sign-in and sign-up pages are temporarily excluded, and Next.js build type
  errors are temporarily bypassed. The authentication pull request must remove
  those exclusions and `typescript.ignoreBuildErrors` before merge, then pass
  the full type-check.

The current SQL files are not a reproducible database migration: they assume
some tables already exist and disagree with the application over the
`amenity_types.name`/`label` column. Exporting the live schema and creating
versioned migrations is required follow-up work, but the initial deployment
must not run `supabase/setup.sql` against production.

## Configure GitHub Actions

In the GitHub repository, open **Settings → Secrets and variables → Actions**.

Add this repository variable:

- `NEXT_PUBLIC_SUPABASE_URL`

Add these repository secrets:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

Despite their `NEXT_PUBLIC_` names, keeping tokens in the Secrets UI avoids
printing them in workflow configuration. They are still intentionally visible
to browser code and must be restricted using Supabase RLS and Mapbox URL
restrictions. Never add `SUPABASE_SERVICE_ROLE_KEY` to GitHub Actions or
Vercel.

Run the **CI** workflow once. Then protect `main` under **Settings → Rules →
Rulesets**:

1. Require a pull request before merging.
2. Require status checks to pass.
3. Select `Quality, build, and performance`.
4. Prevent bypassing the rule unless the team has an emergency process.

## Disable submissions before publishing

The temporary `/add` layout prevents normal visitors from reaching the
unfinished form, but UI hiding is not authorization. Before making the Vercel
URL public, verify that Supabase rejects anonymous writes.

In the Supabase SQL editor, inspect policies:

```sql
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where (schemaname = 'public' and tablename = 'add_new_facility')
   or (schemaname = 'storage' and tablename = 'objects');
```

There must be no policy that grants the `anon` or `public` role `INSERT`,
`UPDATE`, or `ALL` access to `add_new_facility` or the
`addlocation-images` bucket. Remove any such policy in the Supabase dashboard
before deployment. Keep public read policies only where the product needs
them. Recheck this after the authentication work adds signed-in policies.

## Connect Vercel

1. Sign in to Vercel with GitHub and choose **Add New → Project**.
2. Import `alanantony24/manago`.
3. Keep the detected **Next.js** framework settings.
4. Confirm the production branch is `main`.
5. Add the following values to both **Preview** and **Production**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
6. Do not add `SUPABASE_SERVICE_ROLE_KEY`.
7. Deploy, then copy the assigned production and preview domains into the
   allowed-URL configuration for Mapbox.

Vercel deploys every feature branch as a preview and deploys `main` as
production. On a Hobby plan, GitHub branch protection is the production gate:
only merge after CI and preview review pass. Vercel Pro can additionally make
the GitHub check a required Production Deployment Check.

## Release checklist

- CI lint, type-check, build, and Lighthouse steps pass.
- `/nearby` loads facilities and renders the map over HTTPS.
- `/help` renders.
- `/add` shows the temporary unavailable message.
- Anonymous Supabase table and storage writes are denied.
- No service-role key appears in GitHub or Vercel.
- Browser and Vercel function logs contain no new runtime errors.

When the authentication pull request is ready, use its Vercel preview to test
sign-in, registration, authorized submission, unauthorized rejection, and
storage policies. Remove the temporary `/add` layout only after those checks
pass.

## Rollback

If production is broken:

1. Open the Vercel project and select **Deployments**.
2. Open the last known-good production deployment.
3. Use **Promote to Production** (or **Rollback**, when shown).
4. Verify `/nearby`, `/help`, and `/add`.
5. Revert the faulty commit in GitHub through a new pull request so repository
   history matches the running version.

Rolling back the application does not roll back Supabase data or schema.
Database migrations therefore need their own reviewed rollback procedure once
the project begins managing them.
