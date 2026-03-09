-- Add host_bringing column: extra people the host is bringing (not joining via app)
alter table public.activities
  add column if not exists host_bringing int not null default 0;
