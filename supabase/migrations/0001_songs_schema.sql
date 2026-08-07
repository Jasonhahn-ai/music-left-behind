-- Songs feature: table, storage bucket, and RLS policies.
-- Run this in the Supabase Dashboard -> SQL Editor.

create extension if not exists pgcrypto;

-- 1. Table
create table public.songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  artist_name text not null,
  story text,
  audio_url text not null,
  artwork_url text,
  created_at timestamptz not null default now()
);

create index songs_user_id_idx on public.songs(user_id);

alter table public.songs enable row level security;

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

-- 2. Storage bucket (public, so streaming works without signed URLs)
insert into storage.buckets (id, name, public)
values ('songs', 'songs', true)
on conflict (id) do nothing;

-- 3. Storage RLS
-- Uploads must live under a folder named after the uploader's user id,
-- e.g. songs/<user_id>/track.mp3, songs/<user_id>/artwork.jpg
create policy "Public read access for songs bucket"
  on storage.objects for select
  using (bucket_id = 'songs');

create policy "Authenticated users can upload to their own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'songs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update files in their own folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'songs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete files in their own folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'songs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
