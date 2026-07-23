-- ManaGo seed helper (optional)
--
-- The live Supabase project already has the full schema. This file only ensures
-- the external_id column that `npm run seed` uses for upserts.
--
-- Do NOT run this as a fresh-project migration, and do NOT run it against
-- production as a deployment step. For RLS lockdown before publish, run
-- housekeeping_secure.sql instead.

alter table public.facilities add column if not exists external_id text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.facilities'::regclass
      and conname = 'facilities_external_id_key'
  ) then
    alter table public.facilities
      add constraint facilities_external_id_key unique (external_id);
  end if;
end $$;
