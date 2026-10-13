-- ============================================================
-- FIX: Admin Catalog CRUD not saving to Supabase
-- Run this in Supabase SQL Editor → https://supabase.com/dashboard
-- ============================================================

-- 1. Fix RLS on `activities` table
--    The app uses the ANON key. Without this policy, INSERT/UPDATE/DELETE are blocked silently.
DROP POLICY IF EXISTS "Admin all activities" ON public.activities;
CREATE POLICY "Admin all activities"
  ON public.activities
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. Fix RLS on `activity_images` table
DROP POLICY IF EXISTS "Admin all activity_images" ON public.activity_images;
CREATE POLICY "Admin all activity_images"
  ON public.activity_images
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- STORAGE BUCKET SETUP (for image uploads)
-- Run via Supabase Dashboard → Storage → New Bucket
-- OR run this SQL if using the Supabase Storage SQL API:
-- ============================================================

-- Create the `activity-images` bucket (public = images accessible via public URL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('activity-images', 'activity-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone (anon + authenticated) to upload images
DROP POLICY IF EXISTS "Public upload activity images" ON storage.objects;
CREATE POLICY "Public upload activity images"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'activity-images');

-- Allow public read of activity images
DROP POLICY IF EXISTS "Public read activity images" ON storage.objects;
CREATE POLICY "Public read activity images"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'activity-images');

-- Allow delete (for replacing old images on update)
DROP POLICY IF EXISTS "Public delete activity images" ON storage.objects;
CREATE POLICY "Public delete activity images"
  ON storage.objects
  FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'activity-images');
