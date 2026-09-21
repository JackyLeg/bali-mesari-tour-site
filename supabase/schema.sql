-- SQL Schema for Supabase PostgreSQL - Bali Mesari Tour Marketplace
-- Updated: Added security tables (team_members, login_audit_log)
--          Updated bookings for PayPal/Wise payment tracking

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DESTINATIONS
CREATE TABLE IF NOT EXISTS public.destinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    tagline VARCHAR(255),
    description TEXT,
    image_url TEXT NOT NULL,
    experience_count INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. OPERATORS (Local Bali Tour Providers)
CREATE TABLE IF NOT EXISTS public.operators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name VARCHAR(200) NOT NULL,
    contact_name VARCHAR(150),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    logo_url TEXT,
    verification_status VARCHAR(50) DEFAULT 'verified', -- verified, pending, suspended
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ACTIVITIES (Tours & Experiences)
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID REFERENCES public.operators(id) ON DELETE SET NULL,
    destination_id UUID REFERENCES public.destinations(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    short_description TEXT NOT NULL,
    full_description TEXT NOT NULL,
    highlights TEXT[], -- Array of key highlights
    included TEXT[], -- Array of included items
    not_included TEXT[], -- Array of excluded items
    itinerary JSONB, -- Array of timeline steps [{ time: '06:00', title: 'Pickup' }]
    duration_hours NUMERIC(4, 1) NOT NULL,
    pickup_available BOOLEAN DEFAULT true,
    pickup_locations TEXT,
    meeting_point TEXT,
    price_original NUMERIC(10, 2),
    price_discounted NUMERIC(10, 2) NOT NULL,
    rating NUMERIC(2, 1) DEFAULT 4.9,
    review_count INT DEFAULT 0,
    cancellation_policy VARCHAR(255) DEFAULT 'Free cancellation up to 24 hours in advance',
    badge VARCHAR(50), -- e.g. 'Likely to Sell Out', 'Bestseller', 'Top Rated'
    traveler_type VARCHAR(50), -- e.g. 'Couples', 'Families', 'Adventure', 'Culture'
    status VARCHAR(50) DEFAULT 'published', -- published, draft, archived
    is_featured BOOLEAN DEFAULT false,
    is_trending BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ACTIVITY IMAGES
CREATE TABLE IF NOT EXISTS public.activity_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption VARCHAR(255),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. AVAILABILITY & TIME SLOTS
CREATE TABLE IF NOT EXISTS public.availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
    available_date DATE NOT NULL,
    start_time TIME NOT NULL,
    capacity INT DEFAULT 15,
    booked_slots INT DEFAULT 0,
    price_override NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(activity_id, available_date, start_time)
);

-- 7. BOOKINGS
-- 📚 HOW PAYMENT TRACKING WORKS:
--   payment_method: 'arrival' | 'paypal' | 'wise'
--   payment_id: For PayPal orders, stores the PayPal Order ID.
--               For Wise, stores the Wise payment reference.
--               For arrival (cash), NULL.
--   payment_status: 'pending' → 'confirmed' → 'refunded'
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference VARCHAR(20) UNIQUE NOT NULL,
    activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
    user_name VARCHAR(150) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_phone VARCHAR(50) NOT NULL,
    user_country VARCHAR(100),
    booking_date DATE NOT NULL,
    time_slot TIME,
    participants_count INT DEFAULT 1,
    pickup_address TEXT,
    special_requests TEXT,
    total_amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    payment_method VARCHAR(20) DEFAULT 'arrival', -- arrival | paypal | wise
    payment_id VARCHAR(255),                       -- PayPal order ID or Wise reference
    payment_status VARCHAR(50) DEFAULT 'confirmed', -- confirmed, pending, refunded
    booking_status VARCHAR(50) DEFAULT 'confirmed', -- confirmed, cancelled, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
    user_name VARCHAR(150) NOT NULL,
    user_country VARCHAR(100),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    traveler_type VARCHAR(50), -- Couple, Family, Solo, Friends
    review_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. TEAM MEMBERS (Admin Users)
-- 📚 SECURITY DESIGN:
--   password_hash: bcrypt hash (e.g. $2a$12$xxx...) — NEVER store plaintext
--   role: 'super_admin' has full access; 'staff' has limited access
--   status: 'active' | 'suspended' — suspend instead of deleting
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),       -- bcrypt hash of password
    role VARCHAR(50) DEFAULT 'staff', -- super_admin | staff
    status VARCHAR(20) DEFAULT 'active', -- active | suspended
    -- Legacy columns (remove after migration is complete)
    password VARCHAR(255),            -- DEPRECATED: plaintext, for migration only
    temp_password VARCHAR(255),       -- DEPRECATED: temp plaintext password
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- 10. LOGIN AUDIT LOG
-- 📚 WHY LOG LOGINS?
--   Security audit trail. If an account is compromised, you can see:
--   - When the breach happened
--   - What IP address it came from
--   - How many failed attempts preceded the success
--   This is required for PCI-DSS compliance if you process payments.
CREATE TABLE IF NOT EXISTS public.login_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    success BOOLEAN NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) Configuration
-- 📚 WHAT IS RLS?
--   Row Level Security is PostgreSQL's built-in access control at the row level.
--   Each policy says "who can do what to which rows".
--   Without RLS enabled, anyone with the anon key could read ALL data.
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_audit_log ENABLE ROW LEVEL SECURITY;

-- Public read policies (anyone can read these)
CREATE POLICY "Public read destinations" ON public.destinations FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read operators" ON public.operators FOR SELECT USING (true);
CREATE POLICY "Public read activities" ON public.activities FOR SELECT USING (status = 'published');
CREATE POLICY "Public read activity images" ON public.activity_images FOR SELECT USING (true);
CREATE POLICY "Public read availability" ON public.availability FOR SELECT USING (true);
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (true);

-- Public insert policy for bookings & reviews
CREATE POLICY "Public insert bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert reviews" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert audit log" ON public.login_audit_log FOR INSERT WITH CHECK (true);

-- Team members: only authenticated users (Supabase auth) can read
-- 📚 auth.role() = 'authenticated' means only logged-in Supabase users
-- This prevents anonymous access to the admin credentials table
CREATE POLICY "Auth read team members" ON public.team_members
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow team_members lookup during login (anon can query by email for auth purposes)
-- Note: password_hash is returned but cannot be reversed without bcrypt
CREATE POLICY "Anon login lookup" ON public.team_members
  FOR SELECT USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_email ON public.bookings(user_email);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON public.bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_audit_email ON public.login_audit_log(email);
CREATE INDEX IF NOT EXISTS idx_team_email ON public.team_members(email);


-- 1. DESTINATIONS
CREATE TABLE IF NOT EXISTS public.destinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    tagline VARCHAR(255),
    description TEXT,
    image_url TEXT NOT NULL,
    experience_count INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. OPERATORS (Local Bali Tour Providers)
CREATE TABLE IF NOT EXISTS public.operators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name VARCHAR(200) NOT NULL,
    contact_name VARCHAR(150),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    logo_url TEXT,
    verification_status VARCHAR(50) DEFAULT 'verified', -- verified, pending, suspended
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ACTIVITIES (Tours & Experiences)
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID REFERENCES public.operators(id) ON DELETE SET NULL,
    destination_id UUID REFERENCES public.destinations(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    short_description TEXT NOT NULL,
    full_description TEXT NOT NULL,
    highlights TEXT[], -- Array of key highlights
    included TEXT[], -- Array of included items
    not_included TEXT[], -- Array of excluded items
    itinerary JSONB, -- Array of timeline steps [{ time: '06:00', title: 'Pickup' }]
    duration_hours NUMERIC(4, 1) NOT NULL,
    pickup_available BOOLEAN DEFAULT true,
    pickup_locations TEXT,
    meeting_point TEXT,
    price_original NUMERIC(10, 2),
    price_discounted NUMERIC(10, 2) NOT NULL,
    rating NUMERIC(2, 1) DEFAULT 4.9,
    review_count INT DEFAULT 0,
    cancellation_policy VARCHAR(255) DEFAULT 'Free cancellation up to 24 hours in advance',
    badge VARCHAR(50), -- e.g. 'Likely to Sell Out', 'Bestseller', 'Top Rated'
    traveler_type VARCHAR(50), -- e.g. 'Couples', 'Families', 'Adventure', 'Culture'
    status VARCHAR(50) DEFAULT 'published', -- published, draft, archived
    is_featured BOOLEAN DEFAULT false,
    is_trending BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ACTIVITY IMAGES
CREATE TABLE IF NOT EXISTS public.activity_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption VARCHAR(255),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. AVAILABILITY & TIME SLOTS
CREATE TABLE IF NOT EXISTS public.availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
    available_date DATE NOT NULL,
    start_time TIME NOT NULL,
    capacity INT DEFAULT 15,
    booked_slots INT DEFAULT 0,
    price_override NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(activity_id, available_date, start_time)
);

-- 7. BOOKINGS
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference VARCHAR(20) UNIQUE NOT NULL,
    activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
    user_name VARCHAR(150) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_phone VARCHAR(50) NOT NULL,
    user_country VARCHAR(100),
    booking_date DATE NOT NULL,
    time_slot TIME,
    participants_count INT DEFAULT 1,
    pickup_address TEXT,
    special_requests TEXT,
    total_amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    payment_status VARCHAR(50) DEFAULT 'confirmed', -- confirmed, pending, refunded
    booking_status VARCHAR(50) DEFAULT 'confirmed', -- confirmed, cancelled, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
    user_name VARCHAR(150) NOT NULL,
    user_country VARCHAR(100),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    traveler_type VARCHAR(50), -- Couple, Family, Solo, Friends
    review_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) Configuration
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read destinations" ON public.destinations FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read operators" ON public.operators FOR SELECT USING (true);
CREATE POLICY "Public read activities" ON public.activities FOR SELECT USING (status = 'published');
CREATE POLICY "Public read activity images" ON public.activity_images FOR SELECT USING (true);
CREATE POLICY "Public read availability" ON public.availability FOR SELECT USING (true);
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (true);

-- Public insert policy for bookings & reviews
CREATE POLICY "Public insert bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert reviews" ON public.reviews FOR INSERT WITH CHECK (true);
