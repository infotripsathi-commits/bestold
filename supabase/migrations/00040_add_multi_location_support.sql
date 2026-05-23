-- Add multi-location support to stores

-- Create store_locations table for multiple physical locations per store
CREATE TABLE IF NOT EXISTS store_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name text NOT NULL, -- e.g., "Downtown Branch", "Mall Location"
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  country text DEFAULT 'US',
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  phone text,
  email text,
  is_primary boolean DEFAULT false, -- One primary location per store
  is_active boolean DEFAULT true,
  business_hours jsonb, -- Store hours in JSON format
  manager_name text,
  manager_phone text,
  manager_email text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_store_locations_store_id ON store_locations(store_id);
CREATE INDEX IF NOT EXISTS idx_store_locations_city ON store_locations(city);
CREATE INDEX IF NOT EXISTS idx_store_locations_coordinates ON store_locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_store_locations_is_active ON store_locations(is_active);

-- Create location_inventory table for tracking product quantity per location
CREATE TABLE IF NOT EXISTS location_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES store_locations(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0,
  reserved_quantity integer NOT NULL DEFAULT 0, -- For pending orders
  available_quantity integer GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
  low_stock_threshold integer DEFAULT 5,
  last_restocked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, location_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_location_inventory_product_id ON location_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_location_inventory_location_id ON location_inventory(location_id);
CREATE INDEX IF NOT EXISTS idx_location_inventory_available ON location_inventory(available_quantity);

-- Create location_staff table for managing staff per location
CREATE TABLE IF NOT EXISTS location_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES store_locations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  role text NOT NULL, -- e.g., "Manager", "Sales Associate", "Inventory Clerk"
  phone text,
  email text,
  is_active boolean DEFAULT true,
  hire_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_location_staff_location_id ON location_staff(location_id);
CREATE INDEX IF NOT EXISTS idx_location_staff_user_id ON location_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_location_staff_is_active ON location_staff(is_active);

-- Create location_analytics table for tracking performance metrics
CREATE TABLE IF NOT EXISTS location_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES store_locations(id) ON DELETE CASCADE,
  date date NOT NULL,
  visits integer DEFAULT 0,
  product_views integer DEFAULT 0,
  orders integer DEFAULT 0,
  revenue numeric(10, 2) DEFAULT 0,
  items_sold integer DEFAULT 0,
  avg_order_value numeric(10, 2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(location_id, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_location_analytics_location_id ON location_analytics(location_id);
CREATE INDEX IF NOT EXISTS idx_location_analytics_date ON location_analytics(date);

-- Enable RLS
ALTER TABLE store_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for store_locations

-- Anyone can view active locations
CREATE POLICY "Anyone can view active store locations"
  ON store_locations FOR SELECT
  USING (is_active = true);

-- Store owners can manage their locations
CREATE POLICY "Store owners can manage their locations"
  ON store_locations FOR ALL
  USING (
    store_id IN (
      SELECT id FROM stores WHERE seller_id = auth.uid()
    )
  );

-- Admins can manage all locations
CREATE POLICY "Admins can manage all store locations"
  ON store_locations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for location_inventory

-- Anyone can view inventory for active locations
CREATE POLICY "Anyone can view location inventory"
  ON location_inventory FOR SELECT
  USING (
    location_id IN (
      SELECT id FROM store_locations WHERE is_active = true
    )
  );

-- Store owners can manage their inventory
CREATE POLICY "Store owners can manage their inventory"
  ON location_inventory FOR ALL
  USING (
    location_id IN (
      SELECT sl.id FROM store_locations sl
      JOIN stores s ON sl.store_id = s.id
      WHERE s.seller_id = auth.uid()
    )
  );

-- Admins can manage all inventory
CREATE POLICY "Admins can manage all inventory"
  ON location_inventory FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for location_staff

-- Store owners can view and manage their staff
CREATE POLICY "Store owners can manage their staff"
  ON location_staff FOR ALL
  USING (
    location_id IN (
      SELECT sl.id FROM store_locations sl
      JOIN stores s ON sl.store_id = s.id
      WHERE s.seller_id = auth.uid()
    )
  );

-- Staff can view their own record
CREATE POLICY "Staff can view their own record"
  ON location_staff FOR SELECT
  USING (user_id = auth.uid());

-- Admins can manage all staff
CREATE POLICY "Admins can manage all staff"
  ON location_staff FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for location_analytics

-- Store owners can view their analytics
CREATE POLICY "Store owners can view their analytics"
  ON location_analytics FOR SELECT
  USING (
    location_id IN (
      SELECT sl.id FROM store_locations sl
      JOIN stores s ON sl.store_id = s.id
      WHERE s.seller_id = auth.uid()
    )
  );

-- System can insert/update analytics
CREATE POLICY "System can manage analytics"
  ON location_analytics FOR ALL
  USING (true);

-- Admins can view all analytics
CREATE POLICY "Admins can view all analytics"
  ON location_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to update location analytics
CREATE OR REPLACE FUNCTION update_location_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function would be called by a cron job or trigger
  -- to update analytics data
  -- Implementation depends on order tracking system
  NULL;
END;
$$;

-- Create function to ensure only one primary location per store
CREATE OR REPLACE FUNCTION ensure_one_primary_location()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_primary = true THEN
    -- Set all other locations for this store to non-primary
    UPDATE store_locations
    SET is_primary = false
    WHERE store_id = NEW.store_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_ensure_one_primary_location
  BEFORE INSERT OR UPDATE ON store_locations
  FOR EACH ROW
  EXECUTE FUNCTION ensure_one_primary_location();

-- Create function to update available quantity
CREATE OR REPLACE FUNCTION update_inventory_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_location_inventory_timestamp
  BEFORE UPDATE ON location_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_timestamp();

CREATE TRIGGER trigger_update_store_locations_timestamp
  BEFORE UPDATE ON store_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_timestamp();

-- Comments
COMMENT ON TABLE store_locations IS 'Multiple physical locations for each store';
COMMENT ON TABLE location_inventory IS 'Product inventory tracking per location';
COMMENT ON TABLE location_staff IS 'Staff members assigned to each location';
COMMENT ON TABLE location_analytics IS 'Performance metrics per location';

COMMENT ON COLUMN store_locations.is_primary IS 'Primary location shown by default';
COMMENT ON COLUMN store_locations.business_hours IS 'JSON format: {"monday": {"open": "09:00", "close": "18:00"}, ...}';
COMMENT ON COLUMN location_inventory.reserved_quantity IS 'Quantity reserved for pending orders';
COMMENT ON COLUMN location_inventory.available_quantity IS 'Computed: quantity - reserved_quantity';
