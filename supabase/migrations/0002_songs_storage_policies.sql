-- Re-applies storage.objects RLS policies for the "songs" bucket.
-- Safe to run even if some/all of these already exist.

drop policy if exists "Public read access for songs bucket" on storage.objects;
drop policy if exists "Authenticated users can upload to their own folder" on storage.objects;
drop policy if exists "Users can update files in their own folder" on storage.objects;
drop policy if exists "Users can delete files in their own folder" on storage.objects;

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
