-- Run this once in your Supabase project's SQL Editor.
-- Creates a public storage bucket for profile pictures, with policies
-- so each user can only upload/change/delete their own photo (stored
-- at avatars/{user_id}/avatar.<ext>), while anyone can view any photo
-- (needed so <img> tags can just load the public URL directly).
-- First name, last name, and the avatar URL itself are stored in
-- Supabase Auth's built-in user metadata — no extra table needed.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can replace their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
