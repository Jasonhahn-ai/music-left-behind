-- Play counts and anonymous likes for songs.
-- Run this in the Supabase Dashboard -> SQL Editor.

alter table public.songs
  add column if not exists play_count integer not null default 0,
  add column if not exists like_count integer not null default 0;

-- Play count increments go through this function rather than a direct
-- RLS UPDATE policy, so anonymous visitors can bump the counter
-- without being granted general UPDATE rights on songs (which would
-- let them rewrite title/audio_url/etc). SECURITY DEFINER makes it run
-- with the function owner's privileges, bypassing RLS for just this
-- one narrow operation.
create or replace function public.increment_play_count(song_id_param uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.songs
  set play_count = play_count + 1
  where id = song_id_param;
end;
$$;

grant execute on function public.increment_play_count(uuid) to anon, authenticated;

-- Anonymous likes: one row per (song, anonymous visitor id). The
-- visitor id is a random UUID generated client-side and stored in
-- localStorage -- self-reported, not cryptographically verified. This
-- is a soft dedupe (the product ask is "prevent easy duplicate
-- likes"), not a strong anti-abuse mechanism.
create table public.song_likes (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references public.songs(id) on delete cascade,
  visitor_id text not null,
  created_at timestamptz not null default now(),
  unique (song_id, visitor_id)
);

create index song_likes_song_id_idx on public.song_likes(song_id);

alter table public.song_likes enable row level security;

create policy "Likes are viewable by everyone"
  on public.song_likes for select
  using (true);

create policy "Anyone can like a song"
  on public.song_likes for insert
  to anon, authenticated
  with check (true);

-- Keep songs.like_count in sync with song_likes without a second
-- client round-trip (avoids "insert like" + "increment counter" being
-- two separate, potentially out-of-order, client calls).
create or replace function public.handle_song_like_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.songs set like_count = like_count + 1 where id = new.song_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.songs set like_count = like_count - 1 where id = old.song_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger song_likes_after_insert
  after insert on public.song_likes
  for each row execute function public.handle_song_like_change();

create trigger song_likes_after_delete
  after delete on public.song_likes
  for each row execute function public.handle_song_like_change();
