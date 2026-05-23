
-- Create featured store plans table
CREATE TABLE IF NOT EXISTS featured_store_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('location', 'state', 'nationwide')),
  duration_days integer NOT NULL DEFAULT 30,
  price numeric(10, 2) NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create featured store applications table
CREATE TABLE IF NOT EXISTS featured_store_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES featured_store_plans(id),
  location_id uuid REFERENCES locations(id),
  state text,
  payment_reference text,
  payment_amount numeric(10, 2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'payment_submitted', 'approved', 'rejected', 'expired')),
  start_date timestamptz,
  end_date timestamptz,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default pricing plans
INSERT INTO featured_store_plans (name, target_type, duration_days, price, description) VALUES
('Location Specific - 30 Days', 'location', 30, 999.00, 'Feature your store in a specific location for 30 days'),
('State Wide - 30 Days', 'state', 30, 4999.00, 'Feature your store across an entire state for 30 days'),
('Nationwide - 30 Days', 'nationwide', 30, 14999.00, 'Feature your store across all of India for 30 days'),
('Location Specific - 7 Days', 'location', 7, 299.00, 'Feature your store in a specific location for 7 days'),
('State Wide - 7 Days', 'state', 7, 1499.00, 'Feature your store across an entire state for 7 days'),
('Nationwide - 7 Days', 'nationwide', 7, 4999.00, 'Feature your store across all of India for 7 days');

-- Enable RLS
ALTER TABLE featured_store_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_store_applications ENABLE ROW LEVEL SECURITY;

-- Policies for featured_store_plans
CREATE POLICY "Anyone can view active plans"
ON featured_store_plans FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Authenticated users can manage plans"
ON featured_store_plans FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policies for featured_store_applications
CREATE POLICY "Sellers can view their own applications"
ON featured_store_applications FOR SELECT
TO authenticated
USING (seller_id = auth.uid());

CREATE POLICY "Sellers can create applications"
ON featured_store_applications FOR INSERT
TO authenticated
WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can update their pending applications"
ON featured_store_applications FOR UPDATE
TO authenticated
USING (seller_id = auth.uid() AND status = 'pending')
WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Admins can manage all applications"
ON featured_store_applications FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_featured_applications_seller ON featured_store_applications(seller_id);
CREATE INDEX idx_featured_applications_store ON featured_store_applications(store_id);
CREATE INDEX idx_featured_applications_status ON featured_store_applications(status);
CREATE INDEX idx_featured_applications_dates ON featured_store_applications(start_date, end_date);

-- Create updated_at triggers
CREATE TRIGGER update_featured_store_plans_updated_at
  BEFORE UPDATE ON featured_store_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_featured_store_applications_updated_at
  BEFORE UPDATE ON featured_store_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to get active featured stores by location
CREATE OR REPLACE FUNCTION get_featured_stores_by_location(
  p_location_id uuid DEFAULT NULL,
  p_state text DEFAULT NULL
)
RETURNS TABLE (
  store_id uuid,
  store_name text,
  store_description text,
  store_logo_url text,
  banner_url text,
  target_type text,
  location_name text,
  state_name text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as store_id,
    s.name as store_name,
    s.description as store_description,
    s.logo_url as store_logo_url,
    sb.image_url as banner_url,
    fsp.target_type,
    l.name as location_name,
    fsa.state as state_name
  FROM featured_store_applications fsa
  JOIN stores s ON fsa.store_id = s.id
  JOIN featured_store_plans fsp ON fsa.plan_id = fsp.id
  LEFT JOIN locations l ON fsa.location_id = l.id
  LEFT JOIN store_banners sb ON s.id = sb.store_id AND sb.is_active = true
  WHERE fsa.status = 'approved'
    AND fsa.start_date <= now()
    AND fsa.end_date >= now()
    AND s.is_active = true
    AND (
      fsp.target_type = 'nationwide'
      OR (fsp.target_type = 'state' AND fsa.state = p_state)
      OR (fsp.target_type = 'location' AND fsa.location_id = p_location_id)
    )
  ORDER BY 
    CASE fsp.target_type
      WHEN 'location' THEN 1
      WHEN 'state' THEN 2
      WHEN 'nationwide' THEN 3
    END,
    fsa.created_at DESC;
END;
$$;
