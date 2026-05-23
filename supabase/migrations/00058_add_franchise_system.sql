-- Add is_franchise to stores table
ALTER TABLE stores ADD COLUMN is_franchise boolean NOT NULL DEFAULT false;

-- Create franchise_plans table
CREATE TABLE franchise_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL,
  duration_days integer NOT NULL,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create franchise_applications table
CREATE TABLE franchise_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES franchise_plans(id),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  approval_status text NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  payment_reference text,
  rejection_reason text,
  applied_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  rejected_at timestamptz,
  approved_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create franchise_payouts table
CREATE TABLE franchise_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'released', 'cancelled')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz,
  released_by uuid REFERENCES profiles(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add return and payout fields to orders table
ALTER TABLE orders ADD COLUMN return_period_ends_at timestamptz;
ALTER TABLE orders ADD COLUMN payout_status text DEFAULT 'pending' CHECK (payout_status IN ('pending', 'eligible', 'released', 'refunded'));
ALTER TABLE orders ADD COLUMN return_requested boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN return_reason text;

-- Create platform_settings table
CREATE TABLE platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES profiles(id)
);

-- Insert default platform UPI ID
INSERT INTO platform_settings (key, value, description) 
VALUES ('platform_upi_id', '', 'Platform UPI ID for receiving payments');

-- Create indexes
CREATE INDEX idx_franchise_applications_store ON franchise_applications(store_id);
CREATE INDEX idx_franchise_applications_status ON franchise_applications(approval_status);
CREATE INDEX idx_franchise_payouts_store ON franchise_payouts(store_id);
CREATE INDEX idx_franchise_payouts_status ON franchise_payouts(status);
CREATE INDEX idx_stores_franchise ON stores(is_franchise);

-- RLS Policies for franchise_plans
ALTER TABLE franchise_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active franchise plans"
  ON franchise_plans FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can manage franchise plans"
  ON franchise_plans FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- RLS Policies for franchise_applications
ALTER TABLE franchise_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own applications"
  ON franchise_applications FOR SELECT
  USING (
    store_id IN (SELECT id FROM stores WHERE seller_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Store owners can create applications"
  ON franchise_applications FOR INSERT
  WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE seller_id = auth.uid())
  );

CREATE POLICY "Admins can update applications"
  ON franchise_applications FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- RLS Policies for franchise_payouts
ALTER TABLE franchise_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Franchise owners can view their payouts"
  ON franchise_payouts FOR SELECT
  USING (
    store_id IN (SELECT id FROM stores WHERE seller_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins can manage payouts"
  ON franchise_payouts FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- RLS Policies for platform_settings
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view platform settings"
  ON platform_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage platform settings"
  ON platform_settings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));