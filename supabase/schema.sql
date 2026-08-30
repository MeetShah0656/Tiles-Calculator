-- Profiles table for user role management
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  business_name TEXT,
  phone_number TEXT,
  logo_url TEXT,
  accent_color TEXT DEFAULT '#6e2020',
  role TEXT DEFAULT 'supervisor', -- 'admin', 'supervisor', 'fabricator'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Jobs table to store project details and overall totals
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone_number TEXT,
  project_name TEXT NOT NULL,
  site_address TEXT,
  notes TEXT,
  rate_per_sqft NUMERIC DEFAULT 0,
  total_area NUMERIC DEFAULT 0,
  grand_total NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
  sync_status TEXT DEFAULT 'synced', -- 'synced', 'pending_sync'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Measurement Rows table for individual piece inputs
CREATE TABLE IF NOT EXISTS public.measurement_rows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs ON DELETE CASCADE NOT NULL,
  length_inches NUMERIC NOT NULL,
  width_inches NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  rounded_length_ft NUMERIC NOT NULL,
  rounded_width_ft NUMERIC NOT NULL,
  area_per_piece NUMERIC NOT NULL,
  total_area NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Subscriptions table for managing user memberships, trials, and Razorpay payments
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
  user_email TEXT,
  plan_name TEXT NOT NULL DEFAULT 'Free',
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'trialing', 'canceled', 'expired'
  payment_provider TEXT DEFAULT 'manual', -- 'razorpay', 'activation_key', 'manual'
  payment_id TEXT,
  order_id TEXT,
  activation_key TEXT,
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Payment audit trail: one row per processed Razorpay payment event.
-- The UNIQUE(provider, payment_id) constraint is what makes payment
-- processing idempotent — see app/api/razorpay/verify-payment and
-- app/api/razorpay/webhook, which insert here before activating a
-- subscription and skip re-activation if the insert hits this constraint
-- (i.e. this exact payment was already processed).
CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'razorpay',
  event_source TEXT NOT NULL, -- 'verify' (client-driven) | 'webhook' (server-to-server)
  event_type TEXT,            -- e.g. 'payment.captured', 'order.paid', 'payment.verified'
  payment_id TEXT NOT NULL,
  order_id TEXT,
  plan_name TEXT,
  amount INTEGER,             -- paise
  currency TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (provider, payment_id)
);

-- Indexes on RLS-checked / foreign-key columns (Supabase perf best practice:
-- every column referenced in a policy's USING/WITH CHECK should be indexed).
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs (user_id);
CREATE INDEX IF NOT EXISTS idx_measurement_rows_job_id ON public.measurement_rows (job_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_email ON public.subscriptions (user_email);
CREATE INDEX IF NOT EXISTS idx_payment_events_user_id ON public.payment_events (user_id);
-- subscriptions.user_id and payment_events.(provider, payment_id) already have
-- implicit indexes via their UNIQUE constraints.

-- RLS (Row Level Security) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurement_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- Policies below use `(select auth.uid())` rather than a bare `auth.uid()` and
-- `TO authenticated` per Supabase's documented RLS performance/best-practice
-- guidance: the subselect lets Postgres evaluate it once per statement instead
-- of once per row, and `TO authenticated` scopes the policy away from `anon`
-- explicitly instead of relying only on `auth.uid()` being null for anon.

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = id);

-- Subscriptions Policies
--
-- SECURITY: these were previously USING (true) / WITH CHECK (true) on every
-- operation, which let any signed-in (or anon, via the public anon key) client
-- read and write ANY user's subscription row directly from the browser —
-- including granting itself Pro status for free. Subscriptions are now:
--   - readable only by their owner
--   - writable by the owner ONLY to self-cancel/downgrade back to Free Tier
--   - otherwise writable only by the server (service role key, which bypasses
--     RLS) after independently verifying a Razorpay payment/webhook or an
--     activation key — see app/api/razorpay/verify-payment, .../webhook, and
--     app/api/activation/redeem.
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can self-downgrade own subscription" ON public.subscriptions
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND status = 'canceled'
    AND plan_name = 'Free Tier'
    AND payment_provider = 'manual'
  );

-- Payment Events Policies (read-only audit trail; only the server, via the
-- service role key which bypasses RLS, ever inserts these rows)
CREATE POLICY "Users can view own payment events" ON public.payment_events
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Jobs Policies
CREATE POLICY "Users can manage own jobs" ON public.jobs
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Measurement Rows Policies
CREATE POLICY "Users can manage own rows" ON public.measurement_rows
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = measurement_rows.job_id
      AND jobs.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = measurement_rows.job_id
      AND jobs.user_id = (SELECT auth.uid())
    )
  );

-- Trigger to automatically create a user profile and default subscription when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  clean_email TEXT;
  hash1 TEXT;
  hash2 TEXT;
  generated_key TEXT;
BEGIN
  -- 1. Create Profile Record
  INSERT INTO public.profiles (id, business_name, phone_number, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'business_name', 'TIVERA Natural Stone'),
    COALESCE(new.raw_user_meta_data->>'phone_number', ''),
    'supervisor'
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Generate Deterministic Activation Key for Email
  clean_email := UPPER(REGEXP_REPLACE(COALESCE(new.email, 'USER'), '[^a-zA-Z0-9]', '', 'g'));
  hash1 := RPAD(SUBSTRING(clean_email FROM 1 FOR 4), 4, 'X');
  hash2 := LPAD(TO_HEX(ABS(HASHTEXT(COALESCE(new.email, 'USER')) % 65535)), 4, '0');
  generated_key := 'TIVERA-7D-' || hash1 || '-' || UPPER(hash2);

  -- 3. Create Default Free Subscription with Assigned Activation Key
  INSERT INTO public.subscriptions (
    user_id,
    user_email,
    plan_name,
    status,
    payment_provider,
    activation_key,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    'Free Tier',
    'active',
    'manual',
    generated_key,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and create it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


