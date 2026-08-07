-- Genre/mood tags for songs.
-- Run this in the Supabase Dashboard -> SQL Editor.

alter table public.songs
  add column if not exists tags text[] not null default '{}';

-- Speeds up "contains this tag" filtering on the browse page.
create index if not exists songs_tags_idx on public.songs using gin (tags);
