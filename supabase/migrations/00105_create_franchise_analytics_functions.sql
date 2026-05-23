-- Function to get franchise store analytics
CREATE OR REPLACE FUNCTION get_franchise_store_analytics(
  p_store_id uuid DEFAULT NULL,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE (
  store_id uuid,
  store_name text,
  total_products bigint,
  total_sales bigint,
  revenue_generated numeric,
  average_order_value numeric,
  average_rating numeric,
  total_reviews bigint,
  active_orders bigint,
  completed_orders bigint,
  cancelled_orders bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id AS store_id,
    s.name AS store_name,
    -- Total products
    COALESCE(COUNT(DISTINCT p.id), 0) AS total_products,
    -- Total sales (completed orders)
    COALESCE(COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.id END), 0) AS total_sales,
    -- Revenue generated (sum of completed orders)
    COALESCE(SUM(CASE WHEN o.order_status = 'delivered' THEN o.total_amount ELSE 0 END), 0) AS revenue_generated,
    -- Average order value
    COALESCE(AVG(CASE WHEN o.order_status = 'delivered' THEN o.total_amount END), 0) AS average_order_value,
    -- Average rating
    COALESCE(AVG(r.rating), 0) AS average_rating,
    -- Total reviews
    COALESCE(COUNT(DISTINCT r.id), 0) AS total_reviews,
    -- Active orders (pending, confirmed, shipped)
    COALESCE(COUNT(DISTINCT CASE WHEN o.order_status IN ('pending', 'confirmed', 'shipped') THEN o.id END), 0) AS active_orders,
    -- Completed orders
    COALESCE(COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.id END), 0) AS completed_orders,
    -- Cancelled orders
    COALESCE(COUNT(DISTINCT CASE WHEN o.order_status = 'cancelled' THEN o.id END), 0) AS cancelled_orders
  FROM stores s
  LEFT JOIN products p ON s.id = p.store_id AND p.deleted_at IS NULL
  LEFT JOIN orders o ON s.id = o.store_id 
    AND (p_start_date IS NULL OR o.created_at >= p_start_date)
    AND (p_end_date IS NULL OR o.created_at <= p_end_date)
  LEFT JOIN reviews r ON s.id = r.store_id
    AND (p_start_date IS NULL OR r.created_at >= p_start_date)
    AND (p_end_date IS NULL OR r.created_at <= p_end_date)
  WHERE s.is_franchise = true
    AND (p_store_id IS NULL OR s.id = p_store_id)
  GROUP BY s.id, s.name
  ORDER BY revenue_generated DESC;
END;
$$;

-- Function to get franchise performance trends over time
CREATE OR REPLACE FUNCTION get_franchise_performance_trends(
  p_store_id uuid DEFAULT NULL,
  p_days integer DEFAULT 30
)
RETURNS TABLE (
  date date,
  total_orders bigint,
  revenue numeric,
  average_order_value numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      CURRENT_DATE - (p_days || ' days')::interval,
      CURRENT_DATE,
      '1 day'::interval
    )::date AS date
  )
  SELECT 
    ds.date,
    COALESCE(COUNT(o.id), 0) AS total_orders,
    COALESCE(SUM(o.total_amount), 0) AS revenue,
    COALESCE(AVG(o.total_amount), 0) AS average_order_value
  FROM date_series ds
  LEFT JOIN orders o ON DATE(o.created_at) = ds.date
    AND o.order_status = 'delivered'
    AND EXISTS (
      SELECT 1 FROM stores s 
      WHERE s.id = o.store_id 
      AND s.is_franchise = true
      AND (p_store_id IS NULL OR s.id = p_store_id)
    )
  GROUP BY ds.date
  ORDER BY ds.date;
END;
$$;