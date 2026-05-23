-- Fix column ambiguity in get_preference_distribution
DROP FUNCTION IF EXISTS get_preference_distribution(interval);

CREATE OR REPLACE FUNCTION get_preference_distribution(
  time_period interval DEFAULT interval '30 days'
)
RETURNS TABLE (
  out_category_id uuid,
  out_category_name text,
  out_view_count bigint,
  out_unique_users bigint,
  out_click_count bigint,
  out_favorite_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as out_category_id,
    c.name as out_category_name,
    COALESCE(v.view_count, 0)::bigint as out_view_count,
    COALESCE(v.unique_users, 0)::bigint as out_unique_users,
    COALESCE(cl.click_count, 0)::bigint as out_click_count,
    COALESCE(f.favorite_count, 0)::bigint as out_favorite_count
  FROM categories c
  LEFT JOIN (
    SELECT 
      pv.category_id as cat_id,
      COUNT(*) as view_count,
      COUNT(DISTINCT pv.user_id) as unique_users
    FROM product_views pv
    WHERE pv.viewed_at > now() - time_period
      AND pv.category_id IS NOT NULL
    GROUP BY pv.category_id
  ) v ON c.id = v.cat_id
  LEFT JOIN (
    SELECT 
      sc.filter_id as fid,
      COUNT(*) as click_count
    FROM suggestion_clicks sc
    WHERE sc.clicked_at > now() - time_period
      AND sc.filter_type = 'category'
    GROUP BY sc.filter_id
  ) cl ON c.id = cl.fid
  LEFT JOIN (
    SELECT 
      p.category_id as cat_id,
      COUNT(*) as favorite_count
    FROM favorites fav
    JOIN products p ON fav.product_id = p.id
    WHERE fav.created_at > now() - time_period
    GROUP BY p.category_id
  ) f ON c.id = f.cat_id
  WHERE COALESCE(v.view_count, 0) > 0 
     OR COALESCE(cl.click_count, 0) > 0 
     OR COALESCE(f.favorite_count, 0) > 0
  ORDER BY out_view_count DESC, out_unique_users DESC
  LIMIT 20;
END;
$$;