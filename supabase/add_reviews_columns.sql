-- Follow-up to add_reviews.sql: a `reviews` table already existed in this
-- project (with only id/facility_id/created_at) before that script ran, so
-- `create table if not exists` in add_reviews.sql silently skipped adding
-- the columns the review feature actually needs. This adds them.

alter table reviews
  add column if not exists rating smallint not null default 5,
  add column if not exists tags text[] not null default '{}',
  add column if not exists comment text,
  add column if not exists is_approved boolean not null default true;

alter table reviews alter column rating drop default;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'reviews_rating_check'
  ) then
    alter table reviews
      add constraint reviews_rating_check check (rating between 1 and 5);
  end if;
end $$;
