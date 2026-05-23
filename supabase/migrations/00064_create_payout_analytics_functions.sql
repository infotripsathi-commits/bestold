-- Function to get monthly payout trends
CREATE OR REPLACE FUNCTION get_monthly_payout_trends(months_back integer DEFAULT 12)
RETURNS TABLE (
  month text,
  total_amount numeric,
  request_count bigint,
  avg_amount numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(DATE_TRUNC('month', pr.created_at), 'Mon YYYY') as month,
    COALESCE(SUM(pr.amount), 0) as total_amount,
    COUNT(*) as request_count,
    COALESCE(AVG(pr.amount), 0) as avg_amount
  FROM payout_requests pr
  WHERE pr.status = 'completed'
  AND pr.created_at >= NOW() - (months_back || ' months')::interval
  GROUP BY DATE_TRUNC('month', pr.created_at)
  ORDER BY DATE_TRUNC('month', pr.created_at) DESC;
END;
$$;

-- Function to get top sellers by payout volume
CREATE OR REPLACE FUNCTION get_top_sellers_by_payouts(limit_count integer DEFAULT 10)
RETURNS TABLE (
  seller_id uuid,
  seller_name text,
  seller_email text,
  total_payouts numeric,
  payout_count bigint,
  avg_payout numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pr.seller_id,
    p.full_name as seller_name,
    p.email as seller_email,
    COALESCE(SUM(pr.amount), 0) as total_payouts,
    COUNT(*) as payout_count,
    COALESCE(AVG(pr.amount), 0) as avg_payout
  FROM payout_requests pr
  JOIN profiles p ON p.id = pr.seller_id
  WHERE pr.status = 'completed'
  GROUP BY pr.seller_id, p.full_name, p.email
  ORDER BY total_payouts DESC
  LIMIT limit_count;
END;
$$;

-- Function to get payment method distribution
CREATE OR REPLACE FUNCTION get_payment_method_distribution()
RETURNS TABLE (
  payment_method text,
  count bigint,
  total_amount numeric,
  percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_count bigint;
BEGIN
  SELECT COUNT(*) INTO total_count
  FROM payout_requests
  WHERE status = 'completed';

  RETURN QUERY
  SELECT
    pr.payment_method,
    COUNT(*) as count,
    COALESCE(SUM(pr.amount), 0) as total_amount,
    CASE 
      WHEN total_count > 0 THEN ROUND((COUNT(*)::numeric / total_count::numeric) * 100, 2)
      ELSE 0
    END as percentage
  FROM payout_requests pr
  WHERE pr.status = 'completed'
  GROUP BY pr.payment_method
  ORDER BY count DESC;
END;
$$;

-- Function to get pending payout aging report
CREATE OR REPLACE FUNCTION get_pending_payout_aging()
RETURNS TABLE (
  request_id uuid,
  seller_name text,
  seller_email text,
  store_name text,
  amount numeric,
  status text,
  days_pending integer,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pr.id as request_id,
    p.full_name as seller_name,
    p.email as seller_email,
    s.name as store_name,
    pr.amount,
    pr.status,
    EXTRACT(DAY FROM NOW() - pr.created_at)::integer as days_pending,
    pr.created_at
  FROM payout_requests pr
  JOIN profiles p ON p.id = pr.seller_id
  JOIN stores s ON s.id = pr.store_id
  WHERE pr.status IN ('pending', 'approved')
  ORDER BY pr.created_at ASC;
END;
$$;

-- Function to get payout conversion metrics
CREATE OR REPLACE FUNCTION get_payout_conversion_metrics()
RETURNS TABLE (
  total_requests bigint,
  pending_count bigint,
  approved_count bigint,
  rejected_count bigint,
  completed_count bigint,
  approval_rate numeric,
  completion_rate numeric,
  avg_processing_days numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE status IN ('approved', 'completed'))::numeric / COUNT(*)::numeric) * 100, 2)
      ELSE 0
    END as approval_rate,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE status = 'completed')::numeric / COUNT(*)::numeric) * 100, 2)
      ELSE 0
    END as completion_rate,
    COALESCE(
      AVG(EXTRACT(DAY FROM paid_at - created_at)) FILTER (WHERE status = 'completed' AND paid_at IS NOT NULL),
      0
    ) as avg_processing_days
  FROM payout_requests;
END;
$$;

-- Function to get comprehensive payout analytics
CREATE OR REPLACE FUNCTION get_payout_analytics_summary()
RETURNS TABLE (
  total_payouts_amount numeric,
  total_payouts_count bigint,
  avg_payout_amount numeric,
  total_pending_amount numeric,
  total_pending_count bigint,
  total_approved_amount numeric,
  total_approved_count bigint,
  total_completed_amount numeric,
  total_completed_count bigint,
  avg_processing_time_days numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(amount), 0) as total_payouts_amount,
    COUNT(*) as total_payouts_count,
    COALESCE(AVG(amount), 0) as avg_payout_amount,
    COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as total_pending_amount,
    COUNT(*) FILTER (WHERE status = 'pending') as total_pending_count,
    COALESCE(SUM(amount) FILTER (WHERE status = 'approved'), 0) as total_approved_amount,
    COUNT(*) FILTER (WHERE status = 'approved') as total_approved_count,
    COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as total_completed_amount,
    COUNT(*) FILTER (WHERE status = 'completed') as total_completed_count,
    COALESCE(
      AVG(EXTRACT(DAY FROM paid_at - created_at)) FILTER (WHERE status = 'completed' AND paid_at IS NOT NULL),
      0
    ) as avg_processing_time_days
  FROM payout_requests;
END;
$$;