-- Run this in the Supabase SQL editor before seeding facilities.

create table if not exists amenity_types (
  id serial primary key,
  slug text unique not null,
  name text not null
);

insert into amenity_types (slug, name) values
  ('toilet_with_bidet', 'Toilet with Bidet'),
  ('water_cooler', 'Water Cooler'),
  ('nursing_room', 'Nursing Room')
on conflict (slug) do nothing;

-- JSON dataset uses string ids like "kml_t_0"; keep UUID primary keys and store those here.
-- If the column already exists without a unique index, run supabase/add_external_id.sql instead.
alter table facilities add column if not exists external_id text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'facilities'::regclass
      and conname = 'facilities_external_id_key'
  ) then
    alter table facilities
      add constraint facilities_external_id_key unique (external_id);
  end if;
end $$;

alter table facilities enable row level security;

drop policy if exists "Public read facilities" on facilities;
create policy "Public read facilities"
  on facilities for select
  using (true);

drop policy if exists "Public read amenity types" on amenity_types;
create policy "Public read amenity types"
  on amenity_types for select
  using (true);
