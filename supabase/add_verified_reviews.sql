-- Run once in Supabase SQL Editor before deploying verified review submissions.
ALTER TABLE public.bookings
  ALTER COLUMN booking_reference TYPE VARCHAR(40);

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS booking_reference VARCHAR(40)
    REFERENCES public.bookings(booking_reference) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS reviews_booking_reference_unique
  ON public.reviews (booking_reference)
  WHERE booking_reference IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.verified_bookings (
  booking_reference VARCHAR(40) PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  capture_id VARCHAR(255) UNIQUE NOT NULL,
  user_name VARCHAR(150) NOT NULL,
  user_country VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.verified_bookings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.verified_bookings FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.verified_bookings TO service_role;
REVOKE INSERT ON public.reviews FROM anon, authenticated;
GRANT SELECT, INSERT ON public.reviews TO service_role;

-- All review submissions now pass through the server API. It validates paid bookings
-- against a private PayPal capture ledger before setting is_verified.
DROP POLICY IF EXISTS "Public insert reviews" ON public.reviews;
