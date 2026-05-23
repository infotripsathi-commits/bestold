-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('return_period_adjustment', 'payout_request', 'order_update', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT NOW()
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  return_period_adjustment_enabled boolean DEFAULT true,
  payout_request_enabled boolean DEFAULT true,
  order_update_enabled boolean DEFAULT true,
  system_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can read their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS policies for notification_preferences
CREATE POLICY "Users can read their own preferences"
  ON notification_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own preferences"
  ON notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences"
  ON notification_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Function to create notification for admins
CREATE OR REPLACE FUNCTION create_admin_notification(
  p_type text,
  p_title text,
  p_message text,
  p_data jsonb DEFAULT '{}'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record record;
  inserted_count integer := 0;
  pref_enabled boolean;
BEGIN
  -- Loop through all admins
  FOR admin_record IN 
    SELECT id FROM profiles WHERE role = 'admin'
  LOOP
    -- Check notification preferences
    SELECT 
      CASE p_type
        WHEN 'return_period_adjustment' THEN return_period_adjustment_enabled
        WHEN 'payout_request' THEN payout_request_enabled
        WHEN 'order_update' THEN order_update_enabled
        WHEN 'system' THEN system_enabled
        ELSE true
      END INTO pref_enabled
    FROM notification_preferences
    WHERE user_id = admin_record.id;
    
    -- If no preferences found, default to enabled
    IF pref_enabled IS NULL THEN
      pref_enabled := true;
    END IF;
    
    -- Create notification if enabled
    IF pref_enabled THEN
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (admin_record.id, p_type, p_title, p_message, p_data);
      
      inserted_count := inserted_count + 1;
    END IF;
  END LOOP;
  
  RETURN inserted_count;
END;
$$;

-- Update generate_return_period_adjustment_suggestions to create notifications
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
  reduce_count integer := 0;
  increase_count integer := 0;
  notification_count integer;
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
      suggested_period := metrics.current_return_period;
      adjustment_type := 'maintain';
      reasoning := format(
        'Good seller performance (score: %.1f/100). Maintain current return period. Return rate: %.1f%%, average rating: %.1f/5.',
        metrics.performance_score,
        metrics.return_rate,
        metrics.avg_product_rating
      );
    ELSIF metrics.return_rate > 20 OR metrics.avg_product_rating < 3 THEN
      suggested_period := LEAST(metrics.current_return_period + 7, 30);
      adjustment_type := 'increase';
      reasoning := format(
        'Performance concerns detected (score: %.1f/100). High return rate (%.1f%%) or low ratings (%.1f/5). Increase return period for customer protection.',
        metrics.performance_score,
        metrics.return_rate,
        metrics.avg_product_rating
      );
    ELSE
      suggested_period := metrics.current_return_period;
      adjustment_type := 'maintain';
      reasoning := format(
        'Average seller performance (score: %.1f/100). Maintain current return period.',
        metrics.performance_score
      );
    END IF;
    
    -- Only create suggestion if there's a change
    IF suggested_period != metrics.current_return_period THEN
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
        
        IF adjustment_type = 'reduce' THEN
          reduce_count := reduce_count + 1;
        ELSIF adjustment_type = 'increase' THEN
          increase_count := increase_count + 1;
        END IF;
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
  
  -- Create notification for admins if suggestions were created
  IF inserted_count > 0 THEN
    SELECT create_admin_notification(
      'return_period_adjustment',
      format('%s New Return Period Adjustments', inserted_count),
      format('%s new return period adjustment suggestions are ready for review. %s reductions, %s increases.', 
        inserted_count, reduce_count, increase_count),
      jsonb_build_object(
        'total_suggestions', inserted_count,
        'reduce_count', reduce_count,
        'increase_count', increase_count,
        'link', '/admin/return-period-adjustments'
      )
    ) INTO notification_count;
  END IF;
  
  RETURN inserted_count;
END;
$$;