-- ============================================================
-- FIX: Bookings not appearing in Supabase after PayPal payment
-- Run this in Supabase SQL Editor → https://supabase.com/dashboard
-- ============================================================

-- 1. Ensure required payment tracking columns exist on bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'arrival';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);

-- 2. Allow ANON / Public client to INSERT, UPDATE, and SELECT bookings
--    (Without this, RLS silently blocks upsert and update calls from checkout & PayPal capture)
DROP POLICY IF EXISTS "Public insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public read bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admin all bookings" ON public.bookings;

CREATE POLICY "Admin all bookings"
  ON public.bookings
  FOR ALL
  USING (true)
  WITH CHECK (true);
