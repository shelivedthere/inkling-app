-- Note image uploads (Supabase Storage).
-- Run in the Supabase SQL editor after deploying the app change.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'note-images',
  'note-images',
  true,
  5242880, -- 5 MB
  array[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ]::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Paths look like: {user_id}/{note_id}/{filename}
-- Authenticated users may manage only objects under their own user_id folder.

drop policy if exists "note_images_select_authenticated" on storage.objects;
drop policy if exists "note_images_insert_own" on storage.objects;
drop policy if exists "note_images_update_own" on storage.objects;
drop policy if exists "note_images_delete_own" on storage.objects;

create policy "note_images_select_authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'note-images');

create policy "note_images_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'note-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "note_images_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'note-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'note-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "note_images_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'note-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
