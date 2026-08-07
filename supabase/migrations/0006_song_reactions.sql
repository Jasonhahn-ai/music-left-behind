-- Emoji reactions for songs, anonymous-visitor style (mirrors
-- 0004_likes_and_plays.sql's song_likes design).
-- Run this in the Supabase Dashboard -> SQL Editor.

alter table public.songs
  add column if not exists reaction_counts jsonb not null default '{}'::jsonb;

-- One row per (song, emoji, visitor): a visitor can react with several
-- different emoji on the same song, just not the same emoji twice.
-- The emoji check constraint keeps this bounded to the fixed set the
-- UI offers -- inserts are wide open to anon, so this is real
-- validation, not just a UI nicety.
create table public.song_reactions (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references public.songs(id) on delete cascade,
  emoji text not null check (emoji in ('🔥', '❤️', '😢', '🤘')),
  visitor_id text not null,
  created_at timestamptz not null default now(),
  unique (song_id, emoji, visitor_id)
);

create index song_reactions_song_id_idx on public.song_reactions(song_id);

alter table public.song_reactions enable row level security;

create policy "Reactions are viewable by everyone"
  on public.song_reactions for select
  using (true);

create policy "Anyone can react to a song"
  on public.song_reactions for insert
  to anon, authenticated
  with check (true);

-- No update/delete policies -- reactions can't be changed or removed,
-- same as likes.

-- Keep songs.reaction_counts in sync, same rationale as like_count:
-- avoids "insert reaction" + "increment counter" being two separate,
-- potentially out-of-order, client calls.
create or replace function public.handle_song_reaction_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.songs
    set reaction_counts = jsonb_set(
      reaction_counts,
      array[new.emoji],
      to_jsonb(coalesce((reaction_counts->>new.emoji)::int, 0) + 1)
    )
    where id = new.song_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.songs
    set reaction_counts = jsonb_set(
      reaction_counts,
      array[old.emoji],
      to_jsonb(greatest(coalesce((reaction_counts->>old.emoji)::int, 0) - 1, 0))
    )
    where id = old.song_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger song_reactions_after_insert
  after insert on public.song_reactions
  for each row execute function public.handle_song_reaction_change();

create trigger song_reactions_after_delete
  after delete on public.song_reactions
  for each row execute function public.handle_song_reaction_change();
