-- ============================================================
-- Storage buckets for user avatars and business media
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ── 1. avatars bucket (public) ──────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload into their own folder
CREATE POLICY "avatars: authenticated upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can replace / update their own file
CREATE POLICY "avatars: owner update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can remove their own file
CREATE POLICY "avatars: owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Anyone (including anonymous) can read avatar images
CREATE POLICY "avatars: public read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');


-- ── 2. business-media bucket (public) ───────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-media',
  'business-media',
  true,
  10485760,  -- 10 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users (business owners) can upload
CREATE POLICY "business-media: authenticated upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'business-media');

-- Authenticated users can replace their own files
CREATE POLICY "business-media: authenticated update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'business-media');

-- Owners can delete their own files
CREATE POLICY "business-media: authenticated delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'business-media');

-- Anyone can view business images
CREATE POLICY "business-media: public read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'business-media');
