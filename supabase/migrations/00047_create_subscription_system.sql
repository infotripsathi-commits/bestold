-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  duration_days integer NOT NULL,
  price numeric(10, 2) NOT NULL,
  features jsonb DEFAULT '["Unlimited product listings", "Online selling capability", "Priority placement"]'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  start_date timestamptz,
  end_date timestamptz,
  amount_paid numeric(10, 2) NOT NULL,
  payment_date timestamptz DEFAULT now(),
  upi_reference text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1,
  product_price numeric(10, 2) NOT NULL,
  delivery_charge numeric(10, 2) DEFAULT 0,
  total_amount numeric(10, 2) NOT NULL,
  delivery_address jsonb NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('upi', 'card', 'netbanking', 'cod')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  order_status text NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  tracking_number text,
  courier_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subscription_settings table
CREATE TABLE IF NOT EXISTS subscription_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upi_id text,
  renewal_behavior text DEFAULT 'extend' CHECK (renewal_behavior IN ('replace', 'extend')),
  updated_at timestamptz DEFAULT now()
);

-- Add subscription fields to stores table
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive')),
ADD COLUMN IF NOT EXISTS current_subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_store_id ON subscriptions(store_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_stores_subscription_status ON stores(subscription_status);

-- Create function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
BEGIN
  RETURN 'ORD' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION set_order_number();

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert default subscription settings
INSERT INTO subscription_settings (id, upi_id, renewal_behavior)
VALUES (gen_random_uuid(), NULL, 'extend')
ON CONFLICT DO NOTHING;

-- RLS Policies

-- subscription_plans: public read, admin write
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active subscription plans"
ON subscription_plans FOR SELECT
TO public
USING (status = 'active');

CREATE POLICY "Admins can manage subscription plans"
ON subscription_plans FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

-- subscriptions: sellers can view their own, admins can view all
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their own subscriptions"
ON subscriptions FOR SELECT
TO authenticated
USING (
  store_id IN (
    SELECT id FROM stores WHERE seller_id = auth.uid()
  )
);

CREATE POLICY "Sellers can create subscriptions for their stores"
ON subscriptions FOR INSERT
TO authenticated
WITH CHECK (
  store_id IN (
    SELECT id FROM stores WHERE seller_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all subscriptions"
ON subscriptions FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

-- orders: buyers can view their orders, sellers can view orders for their products
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view their own orders"
ON orders FOR SELECT
TO authenticated
USING (buyer_id = auth.uid());

CREATE POLICY "Buyers can create orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Sellers can view orders for their products"
ON orders FOR SELECT
TO authenticated
USING (seller_id = auth.uid());

CREATE POLICY "Sellers can update orders for their products"
ON orders FOR UPDATE
TO authenticated
USING (seller_id = auth.uid());

CREATE POLICY "Admins can manage all orders"
ON orders FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

-- subscription_settings: admins only
ALTER TABLE subscription_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage subscription settings"
ON subscription_settings FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));