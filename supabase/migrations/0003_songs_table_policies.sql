-- Re-applies RLS policies for the public.songs table.
-- Safe to run even if some/all of these already exist.

alter table public.songs enable row level security;

drop policy if exists "Songs are viewable by everyone" on public.songs;
drop policy if exists "Authenticated users can insert their own songs" on public.songs;
drop policy if exists "Users can update their own songs" on public.songs;
drop policy if exists "Users can delete their own songs" on public.songs;

create policy "Songs are viewable by everyone"
  on public.songs for select
  using (true);

create policy "Authenticated users can insert their own songs"
  on public.songs for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own songs"
  on public.songs for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own songs"
  on public.songs for delete
  to authenticated
  using (auth.uid() = user_id);
