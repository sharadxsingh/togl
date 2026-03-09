-- Run this in your Supabase SQL editor (after the initial schema.sql)

-- Add user_phone to activity_participants
alter table public.activity_participants
  add column if not exists user_phone text;

-- Notifications table
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  message text not null,
  read boolean default false,
  created_at timestamp with time zone default now()
);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "Authenticated users can create notifications" on public.notifications
  for insert with check (auth.role() = 'authenticated');

create policy "Users can update their own notifications" on public.notifications
  for update using (auth.uid() = user_id);

create policy "Users can delete their own notifications" on public.notifications
  for delete using (auth.uid() = user_id);
