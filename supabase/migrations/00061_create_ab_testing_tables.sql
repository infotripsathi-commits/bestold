-- Create ab_tests table
CREATE TABLE IF NOT EXISTS ab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_name text NOT NULL,
  test_type text NOT NULL CHECK (test_type IN ('title', 'description', 'price', 'images', 'combined')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  start_date timestamptz,
  end_date timestamptz,
  winner_variant_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create ab_test_variants table
CREATE TABLE IF NOT EXISTS ab_test_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
  variant_name text NOT NULL,
  is_control boolean NOT NULL DEFAULT false,
  title text,
  description text,
  price numeric(10, 2),
  images text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add variant_id to product_analytics table
ALTER TABLE product_analytics ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES ab_test_variants(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ab_tests_product_id ON ab_tests(product_id);
CREATE INDEX IF NOT EXISTS idx_ab_tests_seller_id ON ab_tests(seller_id);
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_ab_test_variants_test_id ON ab_test_variants(test_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_variant_id ON product_analytics(variant_id);

-- Enable RLS
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_variants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ab_tests
CREATE POLICY "Sellers can view their own tests"
  ON ab_tests
  FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can create tests"
  ON ab_tests
  FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can update their own tests"
  ON ab_tests
  FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can delete their own tests"
  ON ab_tests
  FOR DELETE
  TO authenticated
  USING (seller_id = auth.uid());

-- RLS Policies for ab_test_variants
CREATE POLICY "Anyone can view variants for active tests"
  ON ab_test_variants
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM ab_tests
      WHERE ab_tests.id = ab_test_variants.test_id
      AND ab_tests.status = 'active'
    )
  );

CREATE POLICY "Sellers can manage variants for their tests"
  ON ab_test_variants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ab_tests
      WHERE ab_tests.id = ab_test_variants.test_id
      AND ab_tests.seller_id = auth.uid()
    )
  );

-- Function to get A/B test results with statistics
CREATE OR REPLACE FUNCTION get_ab_test_results(test_uuid uuid)
RETURNS TABLE (
  variant_id uuid,
  variant_name text,
  is_control boolean,
  total_views bigint,
  total_clicks bigint,
  total_favorites bigint,
  conversion_rate numeric,
  unique_visitors bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id as variant_id,
    v.variant_name,
    v.is_control,
    COUNT(*) FILTER (WHERE pa.event_type = 'view') as total_views,
    COUNT(*) FILTER (WHERE pa.event_type IN ('buy_click', 'chat_click', 'whatsapp_click')) as total_clicks,
    COUNT(*) FILTER (WHERE pa.event_type = 'favorite_add') as total_favorites,
    CASE 
      WHEN COUNT(*) FILTER (WHERE pa.event_type = 'view') > 0
      THEN ROUND((COUNT(*) FILTER (WHERE pa.event_type = 'buy_click')::numeric / COUNT(*) FILTER (WHERE pa.event_type = 'view')::numeric) * 100, 2)
      ELSE 0
    END as conversion_rate,
    COUNT(DISTINCT pa.visitor_id) as unique_visitors
  FROM ab_test_variants v
  LEFT JOIN product_analytics pa ON pa.variant_id = v.id
  WHERE v.test_id = test_uuid
  GROUP BY v.id, v.variant_name, v.is_control
  ORDER BY v.is_control DESC, v.variant_name;
END;
$$;

-- Function to calculate chi-square test for statistical significance
CREATE OR REPLACE FUNCTION calculate_chi_square(
  control_conversions bigint,
  control_views bigint,
  variant_conversions bigint,
  variant_views bigint
)
RETURNS TABLE (
  chi_square_value numeric,
  is_significant boolean,
  confidence_level numeric
)
LANGUAGE plpgsql
AS $$
DECLARE
  expected_control_conversions numeric;
  expected_control_non_conversions numeric;
  expected_variant_conversions numeric;
  expected_variant_non_conversions numeric;
  chi_sq numeric;
  total_conversions bigint;
  total_views bigint;
BEGIN
  total_conversions := control_conversions + variant_conversions;
  total_views := control_views + variant_views;
  
  IF total_views = 0 OR total_conversions = 0 THEN
    RETURN QUERY SELECT 0::numeric, false, 0::numeric;
    RETURN;
  END IF;
  
  expected_control_conversions := (control_views::numeric / total_views::numeric) * total_conversions::numeric;
  expected_control_non_conversions := control_views - expected_control_conversions;
  expected_variant_conversions := (variant_views::numeric / total_views::numeric) * total_conversions::numeric;
  expected_variant_non_conversions := variant_views - expected_variant_conversions;
  
  chi_sq := 
    POWER(control_conversions - expected_control_conversions, 2) / NULLIF(expected_control_conversions, 0) +
    POWER((control_views - control_conversions) - expected_control_non_conversions, 2) / NULLIF(expected_control_non_conversions, 0) +
    POWER(variant_conversions - expected_variant_conversions, 2) / NULLIF(expected_variant_conversions, 0) +
    POWER((variant_views - variant_conversions) - expected_variant_non_conversions, 2) / NULLIF(expected_variant_non_conversions, 0);
  
  -- Chi-square critical value for 95% confidence (1 degree of freedom) is 3.841
  RETURN QUERY SELECT 
    chi_sq,
    chi_sq > 3.841,
    CASE 
      WHEN chi_sq > 10.828 THEN 99.9
      WHEN chi_sq > 6.635 THEN 99.0
      WHEN chi_sq > 3.841 THEN 95.0
      ELSE 0
    END;
END;
$$;