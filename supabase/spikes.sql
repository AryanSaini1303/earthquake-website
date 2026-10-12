-- Spike requests for the EEWS demo. Run this once in the Supabase SQL editor.
--
-- The spike page inserts a row; every open device graph listens for new rows for its
-- own device (Supabase Realtime) and shakes its simulated feed. The anon key can only
-- add and read rows: no updates, no deletes.

create table if not exists public.spikes (
  id         bigint generated always as identity primary key,
  device_id  text not null check (char_length(device_id) between 1 and 64),
  created_at timestamptz not null default now()
);

alter table public.spikes enable row level security;

drop policy if exists "anon can request a spike" on public.spikes;
create policy "anon can request a spike"
  on public.spikes for insert to anon
  with check (true);

-- Realtime only delivers rows the listener is allowed to read.
drop policy if exists "anon can watch spikes" on public.spikes;
create policy "anon can watch spikes"
  on public.spikes for select to anon
  using (true);

-- Publish inserts to Realtime (skipped if already published).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'spikes'
  ) then
    alter publication supabase_realtime add table public.spikes;
  end if;
end $$;

-- Optional housekeeping: spikes are momentary, so old rows can be cleared any time.
--   delete from public.spikes where created_at < now() - interval '1 day';
