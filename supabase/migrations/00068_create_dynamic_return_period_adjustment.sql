-- Create seller performance metrics table
CREATE TABLE IF NOT EXISTS seller_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES profiles(id),
  total_orders integer DEFAULT 0,
  total_returns integer DEFAULT 0,
  return_rate numeric DEFAULT 0,
  avg_product_rating numeric DEFAULT 0,
  account_age_days integer DEFAULT 0,
  performance_score numeric DEFAULT 0,
  current_return_period integer,
  suggested_return_period integer,
  last_calculated_at timestamptz DEFAULT NOW(),
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(seller_id)
);

-- Create return period adjustment suggestions table
CREATE TABLE IF NOT EXISTS return_period_adjustment_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES profiles(id),
  current_return_period integer NOT NULL,
  suggested_return_period integer NOT NULL,
  adjustment_type text NOT NULL CHECK (adjustment_type IN ('reduce', 'increase', 'maintain')),
  reasoning text NOT NULL,
  performance_metrics jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- RLS policies
ALTER TABLE seller_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_period_adjustment_suggestions ENABLE ROW LEVEL SECURITY;

-- Admins can read metrics
CREATE POLICY "Admins can read seller performance metrics"
  ON seller_performance_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can manage suggestions
CREATE POLICY "Admins can read adjustment suggestions"
  ON return_period_adjustment_suggestions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update adjustment suggestions"
  ON return_period_adjustment_suggestions
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

-- Function to calculate seller performance metrics
CREATE OR REPLACE FUNCTION calculate_seller_performance_metrics(p_seller_id uuid)
RETURNS TABLE (
  total_orders integer,
  total_returns integer,
  return_rate numeric,
  avg_product_rating numeric,
  account_age_days integer,
  performance_score numeric,
  current_return_period integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_orders integer;
  v_total_returns integer;
  v_return_rate numeric;
  v_avg_rating numeric;
  v_account_age integer;
  v_performance_score numeric;
  v_current_period integer;
  v_account_created timestamptz;
BEGIN
  -- Get total delivered orders
  SELECT COUNT(*) INTO v_total_orders
  FROM orders
  WHERE seller_id = p_seller_id
  AND order_status = 'delivered';
  
  -- Get total returns (assuming we track this - for now use 0)
  v_total_returns := 0;
  
  -- Calculate return rate
  IF v_total_orders > 0 THEN
    v_return_rate := (v_total_returns::numeric / v_total_orders::numeric) * 100;
  ELSE
    v_return_rate := 0;
  END IF;
  
  -- Get average product rating
  SELECT COALESCE(AVG(rating), 0) INTO v_avg_rating
  FROM reviews r
  JOIN products p ON p.id = r.product_id
  WHERE p.seller_id = p_seller_id;
  
  -- Get account age
  SELECT created_at INTO v_account_created
  FROM profiles
  WHERE id = p_seller_id;
  
  v_account_age := EXTRACT(DAY FROM NOW() - v_account_created)::integer;
  
  -- Get current return period from exceptions or default
  SELECT rps.seller_exceptions->>p_seller_id::text INTO v_current_period
  FROM return_policy_settings rps
  LIMIT 1;
  
  IF v_current_period IS NULL THEN
    SELECT global_default_days INTO v_current_period
    FROM return_policy_settings
    LIMIT 1;
  END IF;
  
  -- Calculate performance score (0-100)
  -- Factors: low return rate (40%), high rating (30%), account age (15%), volume (15%)
  v_performance_score := 
    ((100 - v_return_rate) * 0.4) + -- Lower return rate = higher score
    (v_avg_rating * 20 * 0.3) + -- Rating out of 5, scaled to 100
    (LEAST(v_account_age / 365.0 * 100, 100) * 0.15) + -- Account age up to 1 year
    (LEAST(v_total_orders / 100.0 * 100, 100) * 0.15); -- Volume up to 100 orders
  
  RETURN QUERY SELECT 
    v_total_orders,
    v_total_returns,
    v_return_rate,
    v_avg_rating,
    v_account_age,
    v_performance_score,
    COALESCE(v_current_period, 7);
END;
$$;

-- Function to generate adjustment suggestions
CREATE OR REPLACE FUNCTION generate_return_period_adjustment_suggestions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  seller_record record;
  metrics record;
  suggested_period integer;
  adjustment_type text;
  reasoning text;
  inserted_count integer := 0;
BEGIN
  -- Clear old pending suggestions
  DELETE FROM return_period_adjustment_suggestions
  WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '30 days';
  
  -- Loop through all sellers
  FOR seller_record IN 
    SELECT DISTINCT seller_id 
    FROM orders 
    WHERE order_status = 'delivered'
  LOOP
    -- Calculate metrics
    SELECT * INTO metrics
    FROM calculate_seller_performance_metrics(seller_record.seller_id);
    
    -- Skip if insufficient data
    IF metrics.total_orders < 5 THEN
      CONTINUE;
    END IF;
    
    -- Determine suggested period based on performance
    IF metrics.performance_score >= 80 AND metrics.return_rate < 5 THEN
      -- Excellent performance: reduce return period
      suggested_period := GREATEST(metrics.current_return_period - 7, 0);
      adjustment_type := 'reduce';
      reasoning := format(
        'Excellent seller performance (score: %.1f/100). Low return rate (%.1f%%), high average rating (%.1f/5), %s orders completed. Reward with reduced return period.',
        metrics.performance_score,
        metrics.return_rate,
        metrics.avg_product_rating,
        metrics.total_orders
      );
    ELSIF metrics.performance_score >= 60 AND metrics.return_rate < 10 THEN
      -- Good performance: maintain or slightly reduce
      suggested_period := metrics.current_return_period;
      adjustment_type := 'maintain';
      reasoning := format(
        'Good seller performance (score: %.1f/100). Maintain current return period. Return rate: %.1f%%, average rating: %.1f/5.',
        metrics.performance_score,
        metrics.return_rate,
        metrics.avg_product_rating
      );
    ELSIF metrics.return_rate > 20 OR metrics.avg_product_rating < 3 THEN
      -- Poor performance: increase return period
      suggested_period := LEAST(metrics.current_return_period + 7, 30);
      adjustment_type := 'increase';
      reasoning := format(
        'Performance concerns detected (score: %.1f/100). High return rate (%.1f%%) or low ratings (%.1f/5). Increase return period for customer protection.',
        metrics.performance_score,
        metrics.return_rate,
        metrics.avg_product_rating
      );
    ELSE
      -- Average performance: maintain
      suggested_period := metrics.current_return_period;
      adjustment_type := 'maintain';
      reasoning := format(
        'Average seller performance (score: %.1f/100). Maintain current return period.',
        metrics.performance_score
      );
    END IF;
    
    -- Only create suggestion if there's a change
    IF suggested_period != metrics.current_return_period THEN
      -- Check if suggestion already exists
      IF NOT EXISTS (
        SELECT 1 FROM return_period_adjustment_suggestions
        WHERE seller_id = seller_record.seller_id
        AND status = 'pending'
      ) THEN
        INSERT INTO return_period_adjustment_suggestions (
          seller_id,
          current_return_period,
          suggested_return_period,
          adjustment_type,
          reasoning,
          performance_metrics
        ) VALUES (
          seller_record.seller_id,
          metrics.current_return_period,
          suggested_period,
          adjustment_type,
          reasoning,
          jsonb_build_object(
            'total_orders', metrics.total_orders,
            'return_rate', metrics.return_rate,
            'avg_rating', metrics.avg_product_rating,
            'account_age_days', metrics.account_age_days,
            'performance_score', metrics.performance_score
          )
        );
        
        inserted_count := inserted_count + 1;
      END IF;
    END IF;
    
    -- Update or insert metrics
    INSERT INTO seller_performance_metrics (
      seller_id,
      total_orders,
      total_returns,
      return_rate,
      avg_product_rating,
      account_age_days,
      performance_score,
      current_return_period,
      suggested_return_period,
      last_calculated_at
    ) VALUES (
      seller_record.seller_id,
      metrics.total_orders,
      metrics.total_returns,
      metrics.return_rate,
      metrics.avg_product_rating,
      metrics.account_age_days,
      metrics.performance_score,
      metrics.current_return_period,
      suggested_period,
      NOW()
    )
    ON CONFLICT (seller_id) DO UPDATE SET
      total_orders = EXCLUDED.total_orders,
      total_returns = EXCLUDED.total_returns,
      return_rate = EXCLUDED.return_rate,
      avg_product_rating = EXCLUDED.avg_product_rating,
      account_age_days = EXCLUDED.account_age_days,
      performance_score = EXCLUDED.performance_score,
      current_return_period = EXCLUDED.current_return_period,
      suggested_return_period = EXCLUDED.suggested_return_period,
      last_calculated_at = NOW();
  END LOOP;
  
  RETURN inserted_count;
END;
$$;