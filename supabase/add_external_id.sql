-- Run this in Supabase SQL Editor if seed fails on external_id / ON CONFLICT.

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
