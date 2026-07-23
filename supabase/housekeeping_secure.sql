-- ManaGo Supabase housekeeping + security lockdown
-- Run once in the Supabase SQL editor (Dashboard → SQL → New query).
--
-- What "UNRESTRICTED" means in the Table Editor:
--   Row Level Security (RLS) is OFF. Anyone with your anon/public API key
--   can read and write the whole table. Enable RLS to close that hole.
--
-- This script:
--   1) Drops unused/legacy tables the app no longer uses
--   2) Leaves PostGIS system objects alone (you are not their owner)
--   3) Enables RLS on every app table and sets tight anon policies
--
-- After this runs, privileged writes (reviews, submissions, admin approve)
-- must go through Next.js server actions using SUPABASE_SERVICE_ROLE_KEY.
-- The service role bypasses RLS; the anon key cannot.
--
-- Note: spatial_ref_sys may still show UNRESTRICTED. That is normal —
-- it is owned by the PostGIS extension, not your project role, so RLS
-- cannot be enabled on it from the SQL editor. It is a reference catalog
-- of map projections, not ManaGo user data.

-- ---------------------------------------------------------------------------
-- 1) Drop leftover FKs that still point at the legacy public.users table
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select con.conname, rel.relname as table_name
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    join pg_class ref on ref.oid = con.confrelid
    join pg_namespace refnsp on refnsp.oid = ref.relnamespace
    where con.contype = 'f'
      and nsp.nspname = 'public'
      and refnsp.nspname = 'public'
      and ref.relname = 'users'
  loop
    execute format(
      'alter table public.%I drop constraint if exists %I',
      r.table_name,
      r.conname
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 2) Drop unused / legacy app tables
--    KEEP: facilities, amenity_types, feature_types, facility_submissions,
--          profiles, reviews
--    DROP: users (replaced by profiles + Clerk), add_new_facility (old
--          submission table), incidents (unused)
-- ---------------------------------------------------------------------------
drop table if exists public.add_new_facility cascade;
drop table if exists public.incidents cascade;
drop table if exists public.users cascade;

-- Do NOT drop / alter these PostGIS objects — required for spatial types,
-- and owned by the extension (ALTER/REVOKE will fail with "must be owner"):
--   spatial_ref_sys, geography_columns, geometry_columns

-- ---------------------------------------------------------------------------
-- 3) Enable RLS on every app table
-- ---------------------------------------------------------------------------
alter table public.facilities enable row level security;
alter table public.amenity_types enable row level security;
alter table public.feature_types enable row level security;
alter table public.facility_submissions enable row level security;
alter table public.profiles enable row level security;
alter table public.reviews enable row level security;

-- ---------------------------------------------------------------------------
-- 4) Replace policies: anon/authenticated = public read only
--    No INSERT / UPDATE / DELETE for the anon key on any app table.
-- ---------------------------------------------------------------------------

-- facilities ---------------------------------------------------------------
drop policy if exists "Public read facilities" on public.facilities;
drop policy if exists "Public can read facilities" on public.facilities;
drop policy if exists "Enable read access for all users" on public.facilities;
drop policy if exists "Enable insert for all users" on public.facilities;
drop policy if exists "Enable update for all users" on public.facilities;
drop policy if exists "Enable delete for all users" on public.facilities;

create policy "Public can read facilities"
  on public.facilities for select
  to anon, authenticated
  using (true);

-- amenity_types ------------------------------------------------------------
drop policy if exists "Public read amenity types" on public.amenity_types;
drop policy if exists "Public can read amenity types" on public.amenity_types;

create policy "Public can read amenity types"
  on public.amenity_types for select
  to anon, authenticated
  using (true);

-- feature_types ------------------------------------------------------------
drop policy if exists "Public can read feature types" on public.feature_types;

create policy "Public can read feature types"
  on public.feature_types for select
  to anon, authenticated
  using (true);

-- profiles -----------------------------------------------------------------
drop policy if exists "Public can read profiles" on public.profiles;
drop policy if exists "Public can insert profiles" on public.profiles;
drop policy if exists "Public can update profiles" on public.profiles;

create policy "Public can read profiles"
  on public.profiles for select
  to anon, authenticated
  using (true);

-- reviews ------------------------------------------------------------------
drop policy if exists "Public can read approved reviews" on public.reviews;
drop policy if exists "Public can submit reviews" on public.reviews;
drop policy if exists "Public can read reviews" on public.reviews;
drop policy if exists "Public can insert reviews" on public.reviews;
drop policy if exists "Public can update reviews" on public.reviews;
drop policy if exists "Public can delete reviews" on public.reviews;

create policy "Public can read approved reviews"
  on public.reviews for select
  to anon, authenticated
  using (is_approved = true);

-- facility_submissions -----------------------------------------------------
-- No anon policies on purpose. Listing / inserting / approving goes through
-- the service-role server only (Clerk-gated Next.js actions).
drop policy if exists "Public can insert submissions" on public.facility_submissions;
drop policy if exists "Public can read submissions" on public.facility_submissions;
drop policy if exists "Public can update submissions" on public.facility_submissions;
drop policy if exists "Enable insert for all users" on public.facility_submissions;
drop policy if exists "Enable read access for all users" on public.facility_submissions;
drop policy if exists "Enable update for all users" on public.facility_submissions;

-- ---------------------------------------------------------------------------
-- 5) Explicit table grants (RLS still applies on top of these)
-- ---------------------------------------------------------------------------
grant select on table public.facilities to anon, authenticated;
grant select on table public.amenity_types to anon, authenticated;
grant select on table public.feature_types to anon, authenticated;
grant select on table public.profiles to anon, authenticated;
grant select on table public.reviews to anon, authenticated;

revoke insert, update, delete on table public.facilities from anon, authenticated, public;
revoke insert, update, delete on table public.amenity_types from anon, authenticated, public;
revoke insert, update, delete on table public.feature_types from anon, authenticated, public;
revoke insert, update, delete on table public.profiles from anon, authenticated, public;
revoke insert, update, delete on table public.reviews from anon, authenticated, public;
revoke all on table public.facility_submissions from anon, authenticated, public;

-- ---------------------------------------------------------------------------
-- 6) Storage: block anonymous uploads to the submissions bucket
--    Signed-in uploads still go through the service-role server action.
-- ---------------------------------------------------------------------------
drop policy if exists "Allow public uploads" on storage.objects;
drop policy if exists "Public can upload images" on storage.objects;
drop policy if exists "Anyone can upload" on storage.objects;
drop policy if exists "anon upload addlocation-images" on storage.objects;

-- Keep public read of uploaded photos if you serve them via getPublicUrl.
drop policy if exists "Public can read addlocation images" on storage.objects;
create policy "Public can read addlocation images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'addlocation-images');

-- ---------------------------------------------------------------------------
-- Sanity check (optional): after running, these should show rls_enabled = true
-- and zero write policies for anon on app tables.
-- ---------------------------------------------------------------------------
-- select c.relname as table_name, c.relrowsecurity as rls_enabled
-- from pg_class c
-- join pg_namespace n on n.oid = c.relnamespace
-- where n.nspname = 'public'
--   and c.relkind = 'r'
--   and c.relname in (
--     'facilities', 'amenity_types', 'feature_types',
--     'facility_submissions', 'profiles', 'reviews'
--   )
-- order by 1;
--
-- select tablename, policyname, roles, cmd
-- from pg_policies
-- where schemaname = 'public'
-- order by tablename, cmd, policyname;
