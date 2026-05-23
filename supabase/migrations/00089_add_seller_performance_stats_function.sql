-- Function to get seller performance statistics
CREATE OR REPLACE FUNCTION get_seller_performance_stats()
RETURNS TABLE (
  seller_id uuid,
  seller_name text,
  store_id uuid,
  store_name text,
  total_products bigint,
  approved_products bigint,
  rejected_products bigint,
  pending_products bigint,
  approval_rate numeric,
  avg_approval_hours numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.seller_id,
    COALESCE(pr.full_name, 'Unknown Seller') as seller_name,
    s.id as store_id,
    s.name as store_name,
    COUNT(p.id) as total_products,
    COUNT(p.id) FILTER (WHERE p.status = 'active') as approved_products,
    COUNT(p.id) FILTER (WHERE p.status = 'removed' AND p.rejection_reason IS NOT NULL) as rejected_products,
    COUNT(p.id) FILTER (WHERE p.status = 'pending_approval') as pending_products,
    CASE 
      WHEN COUNT(p.id) FILTER (WHERE p.status IN ('active', 'removed')) > 0 
      THEN (COUNT(p.id) FILTER (WHERE p.status = 'active')::numeric / 
            COUNT(p.id) FILTER (WHERE p.status IN ('active', 'removed'))::numeric * 100)
      ELSE 0
    END as approval_rate,
    COALESCE(
      AVG(
        EXTRACT(EPOCH FROM (p.approved_at::timestamp - p.created_at::timestamp)) / 3600
      ) FILTER (WHERE p.status = 'active' AND p.approved_at IS NOT NULL),
      0
    )::numeric(10,1) as avg_approval_hours
  FROM stores s
  LEFT JOIN profiles pr ON s.seller_id = pr.id
  LEFT JOIN products p ON s.id = p.store_id
  WHERE s.approval_status = 'approved'
  GROUP BY s.seller_id, pr.full_name, s.id, s.name
  HAVING COUNT(p.id) > 0
  ORDER BY approval_rate DESC, total_products DESC
  LIMIT 20;
END;
$$;