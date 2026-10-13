-- ============================================================
-- IDEMPOTENCY & TRANSACTION SAFETY MIGRATION
-- Bali Mesari Tour - Money Transaction Idempotency
-- ============================================================

-- 1. Ensure payment and idempotency columns exist on bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'arrival';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);

-- 2. Add unique constraint index on idempotency_key (ignoring nulls)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_unique_idempotency_key 
ON public.bookings (idempotency_key) 
WHERE idempotency_key IS NOT NULL AND idempotency_key != '';

-- 3. Prevent duplicate payment IDs across bookings (ignoring nulls)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_unique_payment_id 
ON public.bookings (payment_id) 
WHERE payment_id IS NOT NULL AND payment_id != '';

-- 4. Dedicated payment_transactions ledger for idempotency and audit logs
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idempotency_key VARCHAR(120) UNIQUE NOT NULL,
    booking_reference VARCHAR(50) NOT NULL,
    provider VARCHAR(20) NOT NULL,            -- paypal | wise | arrival
    request_type VARCHAR(30) NOT NULL,        -- create_order | capture | link
    provider_transaction_id VARCHAR(255),
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL,              -- pending | completed | failed
    response_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast idempotency lookups
CREATE INDEX IF NOT EXISTS idx_payment_tx_key ON public.payment_transactions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_payment_tx_booking ON public.payment_transactions(booking_reference);

-- RLS for payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public and service role transactions access" ON public.payment_transactions;
CREATE POLICY "Public and service role transactions access"
    ON public.payment_transactions
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 5. Fix RLS on bookings table (Allow anon key to INSERT, UPDATE, and SELECT bookings)
DROP POLICY IF EXISTS "Public insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public read bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admin all bookings" ON public.bookings;

CREATE POLICY "Admin all bookings"
    ON public.bookings
    FOR ALL
    USING (true)
    WITH CHECK (true);
