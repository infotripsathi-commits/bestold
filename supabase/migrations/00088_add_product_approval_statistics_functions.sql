-- Function to get product approval statistics
CREATE OR REPLACE FUNCTION get_product_approval_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  pending_count int;
  avg_approval_hours numeric;
  approved_today_count int;
  rejected_week_count int;
BEGIN
  -- Total pending products
  SELECT COUNT(*) INTO pending_count
  FROM products
  WHERE status = 'pending_approval';

  -- Average approval time in hours
  SELECT COALESCE(
    AVG(EXTRACT(EPOCH FROM (approved_at::timestamp - created_at::timestamp)) / 3600),
    0
  )::numeric(10,1) INTO avg_approval_hours
  FROM products
  WHERE status = 'active' 
  AND approved_at IS NOT NULL
  AND created_at IS NOT NULL;

  -- Products approved today
  SELECT COUNT(*) INTO approved_today_count
  FROM products
  WHERE status = 'active'
  AND approved_at::date = CURRENT_DATE;

  -- Products rejected this week (last 7 days)
  SELECT COUNT(*) INTO rejected_week_count
  FROM products
  WHERE status = 'removed'
  AND rejection_reason IS NOT NULL
  AND updated_at >= CURRENT_DATE - INTERVAL '7 days';

  -- Build result JSON
  result := jsonb_build_object(
    'pending_count', pending_count,
    'avg_approval_hours', avg_approval_hours,
    'approved_today_count', approved_today_count,
    'rejected_week_count', rejected_week_count
  );

  RETURN result;
END;
$$;