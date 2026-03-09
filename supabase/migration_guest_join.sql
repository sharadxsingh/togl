-- Allow guest join: make user_id nullable, add guest fields
alter table public.activity_participants
  alter column user_id drop not null,
  add column if not exists guest_name text,
  add column if not exists guest_phone text;

-- Allow anonymous (unauthenticated) inserts for guest joins
drop policy if exists "Anyone can join as guest" on activity_participants;
create policy "Anyone can join as guest" on activity_participants
  for insert with check (
    user_id is null and guest_name is not null and guest_phone is not null
  );
