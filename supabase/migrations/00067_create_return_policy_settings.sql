-- Create return policy settings table
CREATE TABLE IF NOT EXISTS return_policy_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  global_default_days integer NOT NULL DEFAULT 7,
  category_settings jsonb DEFAULT '{}',
  seller_exceptions jsonb DEFAULT '{}',
  product_exceptions jsonb DEFAULT '{}',
  updated_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Insert default settings
INSERT INTO return_policy_settings (global_default_days, category_settings)
VALUES (7, '{
  "Electronics": 14,
  "Clothing": 7,
  "Furniture": 30,
  "Books": 7,
  "Toys": 7,
  "Sports": 14
}'::jsonb)
ON CONFLICT DO NOTHING;

-- RLS policies for return_policy_settings
ALTER TABLE return_policy_settings ENABLE ROW LEVEL SECURITY;

-- Admin can read settings
CREATE POLICY "Admins can read return policy settings"
  ON return_policy_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can update settings
CREATE POLICY "Admins can update return policy settings"
  ON return_policy_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to get applicable return period for an order
CREATE OR REPLACE FUNCTION get_applicable_return_period(
  p_product_id uuid,
  p_seller_id uuid,
  p_category text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  settings record;
  return_days integer;
  product_exception integer;
  seller_exception integer;
  category_days integer;
BEGIN
  -- Get settings
  SELECT * INTO settings FROM return_policy_settings LIMIT 1;
  
  IF settings IS NULL THEN
    RETURN 7; -- Default fallback
  END IF;
  
  -- Priority 1: Check product exceptions
  IF settings.product_exceptions ? p_product_id::text THEN
    product_exception := (settings.product_exceptions->>p_product_id::text)::integer;
    IF product_exception IS NOT NULL THEN
      RETURN product_exception;
    END IF;
  END IF;
  
  -- Priority 2: Check seller exceptions
  IF settings.seller_exceptions ? p_seller_id::text THEN
    seller_exception := (settings.seller_exceptions->>p_seller_id::text)::integer;
    IF seller_exception IS NOT NULL THEN
      RETURN seller_exception;
    END IF;
  END IF;
  
  -- Priority 3: Check category settings
  IF p_category IS NOT NULL AND settings.category_settings ? p_category THEN
    category_days := (settings.category_settings->>p_category)::integer;
    IF category_days IS NOT NULL THEN
      RETURN category_days;
    END IF;
  END IF;
  
  -- Priority 4: Global default
  RETURN settings.global_default_days;
END;
$$;

-- Update trigger to use configurable return periods
CREATE OR REPLACE FUNCTION set_return_period_on_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  return_period_days integer;
  product_category text;
BEGIN
  -- If order status changed to 'delivered' and return_period_ends_at is not set
  IF NEW.order_status = 'delivered' 
     AND OLD.order_status != 'delivered' 
     AND NEW.return_period_ends_at IS NULL THEN
    
    -- Get product category
    SELECT category INTO product_category
    FROM products
    WHERE id = NEW.product_id;
    
    -- Get applicable return period
    return_period_days := get_applicable_return_period(
      NEW.product_id,
      NEW.seller_id,
      product_category
    );
    
    -- Set return period based on configuration
    IF return_period_days = 0 THEN
      -- No return policy - immediately eligible
      NEW.return_period_ends_at := NOW();
      NEW.payout_status := 'eligible';
    ELSE
      -- Set return period
      NEW.return_period_ends_at := NOW() + (return_period_days || ' days')::interval;
      NEW.payout_status := 'locked';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS trigger_set_return_period ON orders;
CREATE TRIGGER trigger_set_return_period
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_return_period_on_delivery();