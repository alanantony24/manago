-- Reviews left by users for a facility.
-- Run this in the Supabase SQL editor (project has no other checked-in
-- migrations yet, so this is additive/standalone).

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  tags text[] not null default '{}',
  comment text,
  is_approved boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists reviews_facility_id_idx on reviews (facility_id);

alter table reviews enable row level security;

create policy "Public can read approved reviews"
  on reviews for select
  using (is_approved = true);

create policy "Public can submit reviews"
  on reviews for insert
  with check (true);
