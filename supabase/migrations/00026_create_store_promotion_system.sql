-- Create promotion_coupons table
CREATE TABLE IF NOT EXISTS promotion_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create store_promotions table
CREATE TABLE IF NOT EXISTS store_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  original_price DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  final_price DECIMAL(10, 2) NOT NULL,
  coupon_code TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT DEFAULT 'paytm',
  transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create promotion_payments table
CREATE TABLE IF NOT EXISTS promotion_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES store_promotions(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'paytm',
  transaction_id TEXT,
  payment_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add promotion fields to stores table
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS is_promoted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS promotion_expires_at TIMESTAMPTZ;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_store_promotions_store_id ON store_promotions(store_id);
CREATE INDEX IF NOT EXISTS idx_store_promotions_status ON store_promotions(status);
CREATE INDEX IF NOT EXISTS idx_store_promotions_dates ON store_promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotion_coupons_code ON promotion_coupons(code);
CREATE INDEX IF NOT EXISTS idx_promotion_coupons_active ON promotion_coupons(active);
CREATE INDEX IF NOT EXISTS idx_stores_is_promoted ON stores(is_promoted);
CREATE INDEX IF NOT EXISTS idx_promotion_payments_promotion_id ON promotion_payments(promotion_id);

-- RLS Policies for promotion_coupons
ALTER TABLE promotion_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons"
  ON promotion_coupons FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can manage coupons"
  ON promotion_coupons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for store_promotions
ALTER TABLE store_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their own promotions"
  ON store_promotions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = store_promotions.store_id
      AND stores.seller_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can create promotions for their stores"
  ON store_promotions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = store_promotions.store_id
      AND stores.seller_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all promotions"
  ON store_promotions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update promotions"
  ON store_promotions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for promotion_payments
ALTER TABLE promotion_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their own promotion payments"
  ON promotion_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM store_promotions
      JOIN stores ON stores.id = store_promotions.store_id
      WHERE store_promotions.id = promotion_payments.promotion_id
      AND stores.seller_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all promotion payments"
  ON promotion_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can insert promotion payments"
  ON promotion_payments FOR INSERT
  WITH CHECK (true);

-- Function to update store promotion status
CREATE OR REPLACE FUNCTION update_store_promotion_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If promotion becomes active, update store
  IF NEW.status = 'active' AND OLD.status != 'active' THEN
    UPDATE stores
    SET is_promoted = true,
        promotion_expires_at = NEW.end_date
    WHERE id = NEW.store_id;
  END IF;
  
  -- If promotion expires or is cancelled, update store
  IF (NEW.status IN ('expired', 'cancelled')) AND OLD.status = 'active' THEN
    UPDATE stores
    SET is_promoted = false,
        promotion_expires_at = NULL
    WHERE id = NEW.store_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_store_promotion_status
  AFTER UPDATE ON store_promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_store_promotion_status();

-- Function to auto-expire promotions
CREATE OR REPLACE FUNCTION expire_old_promotions()
RETURNS void AS $$
BEGIN
  UPDATE store_promotions
  SET status = 'expired'
  WHERE status = 'active'
  AND end_date < NOW();
  
  UPDATE stores
  SET is_promoted = false,
      promotion_expires_at = NULL
  WHERE is_promoted = true
  AND promotion_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;