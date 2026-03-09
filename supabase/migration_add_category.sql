-- Add category column to activities
alter table public.activities
  add column if not exists category text not null default 'meetup'
  check (category in ('sports', 'meetup', 'study'));
