-- Run this in your Supabase SQL editor

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text,
  college text,
  created_at timestamp with time zone default now()
);

-- Activities table
create table public.activities (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  category text not null default 'meetup' check (category in ('sports', 'meetup', 'study')),
  location text not null,
  datetime timestamp with time zone not null,
  max_participants integer not null default 10,
  host_id uuid references public.users(id) on delete cascade not null,
  host_phone text,
  created_at timestamp with time zone default now()
);

-- Activity participants table
create table public.activity_participants (
  id uuid default gen_random_uuid() primary key,
  activity_id uuid references public.activities(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  joined_at timestamp with time zone default now(),
  unique(activity_id, user_id)
);

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.activities enable row level security;
alter table public.activity_participants enable row level security;

-- Users policies
create policy "Users are viewable by everyone" on public.users
  for select using (true);

create policy "Users can insert their own profile" on public.users
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile" on public.users
  for update using (auth.uid() = id);

-- Activities policies
create policy "Activities are viewable by everyone" on public.activities
  for select using (true);

create policy "Authenticated users can create activities" on public.activities
  for insert with check (auth.uid() = host_id);

create policy "Hosts can update their activities" on public.activities
  for update using (auth.uid() = host_id);

create policy "Hosts can delete their activities" on public.activities
  for delete using (auth.uid() = host_id);

-- Participants policies
create policy "Participants are viewable by everyone" on public.activity_participants
  for select using (true);

create policy "Authenticated users can join activities" on public.activity_participants
  for insert with check (auth.uid() = user_id);

create policy "Users can leave activities" on public.activity_participants
  for delete using (auth.uid() = user_id);

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
