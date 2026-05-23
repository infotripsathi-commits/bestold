-- Function to get overview statistics
CREATE OR REPLACE FUNCTION get_personalization_overview_stats()
RETURNS TABLE (
  total_users_tracked bigint,
  total_views bigint,
  total_clicks bigint,
  total_favorites bigint,
  avg_views_per_user numeric,
  overall_ctr numeric,
  active_users_7d bigint,
  active_users_30d bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(DISTINCT user_id) FROM product_views WHERE user_id IS NOT NULL)::bigint as total_users_tracked,
    (SELECT COUNT(*) FROM product_views)::bigint as total_views,
    (SELECT COUNT(*) FROM suggestion_clicks)::bigint as total_clicks,
    (SELECT COUNT(*) FROM favorites)::bigint as total_favorites,
    (SELECT CASE 
      WHEN COUNT(DISTINCT user_id) > 0 
      THEN COUNT(*)::numeric / COUNT(DISTINCT user_id)
      ELSE 0 
    END FROM product_views WHERE user_id IS NOT NULL) as avg_views_per_user,
    (SELECT CASE 
      WHEN COUNT(*) > 0 
      THEN (SELECT COUNT(*) FROM suggestion_clicks)::numeric / COUNT(*) * 100
      ELSE 0 
    END FROM filter_usage_logs) as overall_ctr,
    (SELECT COUNT(DISTINCT user_id) FROM product_views 
     WHERE viewed_at > now() - interval '7 days' AND user_id IS NOT NULL)::bigint as active_users_7d,
    (SELECT COUNT(DISTINCT user_id) FROM product_views 
     WHERE viewed_at > now() - interval '30 days' AND user_id IS NOT NULL)::bigint as active_users_30d;
END;
$$;

-- Function to get preference distribution
CREATE OR REPLACE FUNCTION get_preference_distribution(
  time_period interval DEFAULT interval '30 days'
)
RETURNS TABLE (
  category_id uuid,
  category_name text,
  view_count bigint,
  unique_users bigint,
  click_count bigint,
  favorite_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as category_id,
    c.name as category_name,
    COALESCE(v.view_count, 0)::bigint as view_count,
    COALESCE(v.unique_users, 0)::bigint as unique_users,
    COALESCE(cl.click_count, 0)::bigint as click_count,
    COALESCE(f.favorite_count, 0)::bigint as favorite_count
  FROM categories c
  LEFT JOIN (
    SELECT 
      category_id,
      COUNT(*) as view_count,
      COUNT(DISTINCT user_id) as unique_users
    FROM product_views
    WHERE viewed_at > now() - time_period
      AND category_id IS NOT NULL
    GROUP BY category_id
  ) v ON c.id = v.category_id
  LEFT JOIN (
    SELECT 
      filter_id,
      COUNT(*) as click_count
    FROM suggestion_clicks
    WHERE clicked_at > now() - time_period
      AND filter_type = 'category'
    GROUP BY filter_id
  ) cl ON c.id = cl.filter_id
  LEFT JOIN (
    SELECT 
      p.category_id,
      COUNT(*) as favorite_count
    FROM favorites fav
    JOIN products p ON fav.product_id = p.id
    WHERE fav.created_at > now() - time_period
    GROUP BY p.category_id
  ) f ON c.id = f.category_id
  WHERE COALESCE(v.view_count, 0) > 0 
     OR COALESCE(cl.click_count, 0) > 0 
     OR COALESCE(f.favorite_count, 0) > 0
  ORDER BY view_count DESC, unique_users DESC
  LIMIT 20;
END;
$$;

-- Function to get trending category combinations
CREATE OR REPLACE FUNCTION get_trending_category_combinations(
  time_period interval DEFAULT interval '7 days',
  min_occurrences int DEFAULT 2
)
RETURNS TABLE (
  category_ids uuid[],
  category_names text[],
  occurrence_count bigint,
  unique_users bigint,
  avg_session_views numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH category_sessions AS (
    SELECT 
      session_id,
      user_id,
      array_agg(DISTINCT category_id ORDER BY category_id) as cat_ids,
      COUNT(*) as view_count
    FROM product_views
    WHERE viewed_at > now() - time_period
      AND category_id IS NOT NULL
    GROUP BY session_id, user_id
    HAVING COUNT(DISTINCT category_id) >= 2
  )
  SELECT 
    cs.cat_ids as category_ids,
    array_agg(c.name ORDER BY c.id) as category_names,
    COUNT(*)::bigint as occurrence_count,
    COUNT(DISTINCT cs.user_id)::bigint as unique_users,
    AVG(cs.view_count) as avg_session_views
  FROM category_sessions cs
  CROSS JOIN LATERAL unnest(cs.cat_ids) as cat_id
  JOIN categories c ON c.id = cat_id
  GROUP BY cs.cat_ids
  HAVING COUNT(*) >= min_occurrences
  ORDER BY occurrence_count DESC, unique_users DESC
  LIMIT 15;
END;
$$;

-- Function to get effectiveness metrics
CREATE OR REPLACE FUNCTION get_personalization_effectiveness_metrics(
  time_period interval DEFAULT interval '30 days'
)
RETURNS TABLE (
  metric_name text,
  metric_value numeric,
  metric_description text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'suggestion_ctr'::text as metric_name,
    CASE 
      WHEN (SELECT COUNT(*) FROM filter_usage_logs WHERE created_at > now() - time_period) > 0
      THEN (SELECT COUNT(*) FROM suggestion_clicks WHERE clicked_at > now() - time_period)::numeric / 
           (SELECT COUNT(*) FROM filter_usage_logs WHERE created_at > now() - time_period) * 100
      ELSE 0
    END as metric_value,
    'Click-through rate on filter suggestions (%)'::text as metric_description
  
  UNION ALL
  
  SELECT 
    'personalized_ctr'::text,
    CASE 
      WHEN (SELECT COUNT(*) FROM suggestion_clicks WHERE clicked_at > now() - time_period AND suggestion_reason = 'Based on your activity') > 0
      THEN (SELECT COUNT(*) FROM suggestion_clicks WHERE clicked_at > now() - time_period AND suggestion_reason = 'Based on your activity')::numeric / 
           NULLIF((SELECT COUNT(*) FROM filter_usage_logs WHERE created_at > now() - time_period AND user_id IS NOT NULL), 0) * 100
      ELSE 0
    END,
    'CTR for personalized suggestions (%)'::text
  
  UNION ALL
  
  SELECT 
    'avg_suggestions_per_session'::text,
    CASE 
      WHEN (SELECT COUNT(DISTINCT session_id) FROM filter_usage_logs WHERE created_at > now() - time_period) > 0
      THEN (SELECT COUNT(*) FROM suggestion_clicks WHERE clicked_at > now() - time_period)::numeric / 
           (SELECT COUNT(DISTINCT session_id) FROM filter_usage_logs WHERE created_at > now() - time_period)
      ELSE 0
    END,
    'Average suggestions clicked per session'::text
  
  UNION ALL
  
  SELECT 
    'user_engagement_rate'::text,
    CASE 
      WHEN (SELECT COUNT(DISTINCT user_id) FROM product_views WHERE viewed_at > now() - time_period AND user_id IS NOT NULL) > 0
      THEN (SELECT COUNT(DISTINCT user_id) FROM suggestion_clicks WHERE clicked_at > now() - time_period AND user_id IS NOT NULL)::numeric / 
           (SELECT COUNT(DISTINCT user_id) FROM product_views WHERE viewed_at > now() - time_period AND user_id IS NOT NULL) * 100
      ELSE 0
    END,
    'Percentage of users who clicked suggestions (%)'::text;
END;
$$;

-- Function to get individual user preference profile
CREATE OR REPLACE FUNCTION get_user_preference_profile(
  p_user_id uuid
)
RETURNS TABLE (
  category_id uuid,
  category_name text,
  subcategory_id uuid,
  subcategory_name text,
  view_count bigint,
  favorite_count bigint,
  click_count bigint,
  last_activity timestamptz,
  preference_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_views AS (
    SELECT 
      pv.category_id,
      pv.subcategory_id,
      COUNT(*) as views,
      MAX(pv.viewed_at) as last_view
    FROM product_views pv
    WHERE pv.user_id = p_user_id
    GROUP BY pv.category_id, pv.subcategory_id
  ),
  user_favorites AS (
    SELECT 
      p.category_id,
      p.subcategory_id,
      COUNT(*) as favs
    FROM favorites f
    JOIN products p ON f.product_id = p.id
    WHERE f.user_id = p_user_id
    GROUP BY p.category_id, p.subcategory_id
  ),
  user_clicks AS (
    SELECT 
      filter_id,
      COUNT(*) as clicks
    FROM suggestion_clicks
    WHERE user_id = p_user_id
    GROUP BY filter_id
  )
  SELECT 
    COALESCE(uv.category_id, uf.category_id) as category_id,
    c.name as category_name,
    COALESCE(uv.subcategory_id, uf.subcategory_id) as subcategory_id,
    s.name as subcategory_name,
    COALESCE(uv.views, 0)::bigint as view_count,
    COALESCE(uf.favs, 0)::bigint as favorite_count,
    COALESCE(uc_cat.clicks, uc_sub.clicks, 0)::bigint as click_count,
    uv.last_view as last_activity,
    (COALESCE(uv.views, 0) * 1.0 + COALESCE(uf.favs, 0) * 2.0)::numeric as preference_score
  FROM user_views uv
  FULL OUTER JOIN user_favorites uf 
    ON uv.category_id = uf.category_id 
    AND (uv.subcategory_id = uf.subcategory_id OR (uv.subcategory_id IS NULL AND uf.subcategory_id IS NULL))
  LEFT JOIN categories c ON COALESCE(uv.category_id, uf.category_id) = c.id
  LEFT JOIN subcategories s ON COALESCE(uv.subcategory_id, uf.subcategory_id) = s.id
  LEFT JOIN user_clicks uc_cat ON c.id = uc_cat.filter_id
  LEFT JOIN user_clicks uc_sub ON s.id = uc_sub.filter_id
  ORDER BY preference_score DESC, last_activity DESC NULLS LAST;
END;
$$;