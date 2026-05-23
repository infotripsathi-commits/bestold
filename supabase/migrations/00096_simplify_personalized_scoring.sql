-- Simplify the function to only use views and wishlist (no orders table)
DROP FUNCTION IF EXISTS get_user_category_preferences(uuid, int);

CREATE OR REPLACE FUNCTION get_user_category_preferences(
  p_user_id uuid,
  preference_limit int DEFAULT 10
)
RETURNS TABLE (
  category_id uuid,
  subcategory_id uuid,
  filter_type text,
  preference_score numeric,
  view_count bigint,
  purchase_count bigint,
  wishlist_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH 
  -- Product views (weight: 1.0)
  view_scores AS (
    SELECT 
      pv.category_id,
      pv.subcategory_id,
      COUNT(*) as view_count,
      SUM(
        CASE 
          WHEN pv.viewed_at > now() - interval '7 days' THEN 1.0
          WHEN pv.viewed_at > now() - interval '30 days' THEN 0.7
          WHEN pv.viewed_at > now() - interval '90 days' THEN 0.4
          ELSE 0.2
        END
      ) * 1.0 as weighted_score
    FROM product_views pv
    WHERE pv.user_id = p_user_id
      AND pv.viewed_at > now() - interval '180 days'
    GROUP BY pv.category_id, pv.subcategory_id
  ),
  -- Wishlist items (weight: 2.0)
  wishlist_scores AS (
    SELECT 
      p.category_id,
      p.subcategory_id,
      COUNT(*) as wishlist_count,
      SUM(
        CASE 
          WHEN w.created_at > now() - interval '7 days' THEN 1.0
          WHEN w.created_at > now() - interval '30 days' THEN 0.7
          WHEN w.created_at > now() - interval '90 days' THEN 0.4
          ELSE 0.2
        END
      ) * 2.0 as weighted_score
    FROM wishlist w
    JOIN products p ON w.product_id = p.id
    WHERE w.user_id = p_user_id
      AND w.created_at > now() - interval '180 days'
    GROUP BY p.category_id, p.subcategory_id
  ),
  -- Combine all scores
  combined_scores AS (
    -- Category-level scores
    SELECT 
      cat_id as category_id,
      NULL::uuid as subcategory_id,
      'category' as filter_type,
      SUM(score) as preference_score,
      SUM(views) as view_count,
      0::bigint as purchase_count,
      SUM(wishlists) as wishlist_count
    FROM (
      SELECT 
        category_id as cat_id,
        COALESCE(weighted_score, 0) as score,
        COALESCE(view_count, 0) as views,
        0::bigint as wishlists
      FROM view_scores
      
      UNION ALL
      
      SELECT 
        category_id as cat_id,
        COALESCE(weighted_score, 0) as score,
        0::bigint as views,
        COALESCE(wishlist_count, 0) as wishlists
      FROM wishlist_scores
    ) all_scores
    WHERE cat_id IS NOT NULL
    GROUP BY cat_id
    
    UNION ALL
    
    -- Subcategory-level scores
    SELECT 
      NULL::uuid as category_id,
      subcat_id as subcategory_id,
      'subcategory' as filter_type,
      SUM(score) as preference_score,
      SUM(views) as view_count,
      0::bigint as purchase_count,
      SUM(wishlists) as wishlist_count
    FROM (
      SELECT 
        subcategory_id as subcat_id,
        COALESCE(weighted_score, 0) as score,
        COALESCE(view_count, 0) as views,
        0::bigint as wishlists
      FROM view_scores
      WHERE subcategory_id IS NOT NULL
      
      UNION ALL
      
      SELECT 
        subcategory_id as subcat_id,
        COALESCE(weighted_score, 0) as score,
        0::bigint as views,
        COALESCE(wishlist_count, 0) as wishlists
      FROM wishlist_scores
      WHERE subcategory_id IS NOT NULL
    ) all_scores
    WHERE subcat_id IS NOT NULL
    GROUP BY subcat_id
  )
  SELECT * FROM combined_scores
  ORDER BY preference_score DESC
  LIMIT preference_limit;
END;
$$;