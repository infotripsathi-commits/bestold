-- Simplify personalized suggestions to just use user preferences
DROP FUNCTION IF EXISTS get_filter_suggestions(uuid[], uuid[], uuid, int);

CREATE OR REPLACE FUNCTION get_filter_suggestions(
  current_category_ids uuid[] DEFAULT '{}',
  current_subcategory_ids uuid[] DEFAULT '{}',
  p_user_id uuid DEFAULT NULL,
  suggestion_limit int DEFAULT 5
)
RETURNS TABLE (
  filter_id uuid,
  filter_type text,
  filter_name text,
  reason text,
  usage_count bigint,
  relevance_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If user is logged in, prioritize personalized suggestions
  IF p_user_id IS NOT NULL THEN
    RETURN QUERY
    WITH user_preferences AS (
      SELECT * FROM get_user_category_preferences(p_user_id, 10)
    )
    SELECT 
      COALESCE(c.id, s.id) as filter_id,
      up.out_filter_type as filter_type,
      COALESCE(c.name, s.name) as filter_name,
      'Based on your activity' as reason,
      up.out_view_count + up.out_wishlist_count as usage_count,
      up.out_preference_score as relevance_score
    FROM user_preferences up
    LEFT JOIN categories c ON up.out_category_id = c.id
    LEFT JOIN subcategories s ON up.out_subcategory_id = s.id
    WHERE 
      (up.out_category_id IS NOT NULL AND up.out_category_id != ALL(current_category_ids))
      OR (up.out_subcategory_id IS NOT NULL AND up.out_subcategory_id != ALL(current_subcategory_ids))
    ORDER BY up.out_preference_score DESC
    LIMIT suggestion_limit;
  
  -- If no user, use original logic (co-occurrence or popular)
  ELSE
    IF array_length(current_category_ids, 1) > 0 OR array_length(current_subcategory_ids, 1) > 0 THEN
      RETURN QUERY
      WITH co_occurring_filters AS (
        SELECT 
          cat_id,
          COUNT(*) as occurrence_count
        FROM (
          SELECT unnest(category_ids) as cat_id
          FROM filter_usage_logs
          WHERE 
            created_at > now() - interval '30 days'
            AND (
              category_ids && current_category_ids 
              OR subcategory_ids && current_subcategory_ids
            )
        ) sub
        WHERE cat_id != ALL(current_category_ids)
        GROUP BY cat_id
        
        UNION ALL
        
        SELECT 
          sub_id as cat_id,
          COUNT(*) as occurrence_count
        FROM (
          SELECT unnest(subcategory_ids) as sub_id
          FROM filter_usage_logs
          WHERE 
            created_at > now() - interval '30 days'
            AND (
              category_ids && current_category_ids 
              OR subcategory_ids && current_subcategory_ids
            )
        ) sub
        WHERE sub_id != ALL(current_subcategory_ids)
        GROUP BY sub_id
      ),
      suggestions_with_names AS (
        SELECT 
          c.id as filter_id,
          'category' as filter_type,
          c.name as filter_name,
          'Often selected together' as reason,
          COALESCE(cof.occurrence_count, 0) as usage_count,
          (COALESCE(cof.occurrence_count, 0)::numeric / NULLIF((SELECT COUNT(*) FROM filter_usage_logs WHERE created_at > now() - interval '30 days'), 0)) * 100 as relevance_score
        FROM categories c
        INNER JOIN co_occurring_filters cof ON c.id = cof.cat_id
        
        UNION ALL
        
        SELECT 
          s.id as filter_id,
          'subcategory' as filter_type,
          s.name as filter_name,
          'Often selected together' as reason,
          COALESCE(cof.occurrence_count, 0) as usage_count,
          (COALESCE(cof.occurrence_count, 0)::numeric / NULLIF((SELECT COUNT(*) FROM filter_usage_logs WHERE created_at > now() - interval '30 days'), 0)) * 100 as relevance_score
        FROM subcategories s
        INNER JOIN co_occurring_filters cof ON s.id = cof.cat_id
      )
      SELECT * FROM suggestions_with_names
      ORDER BY relevance_score DESC, usage_count DESC
      LIMIT suggestion_limit;
    
    ELSE
      -- Show popular filters
      RETURN QUERY
      WITH popular_categories AS (
        SELECT 
          cat_id,
          COUNT(*) as usage_count
        FROM (
          SELECT unnest(category_ids) as cat_id
          FROM filter_usage_logs
          WHERE created_at > now() - interval '7 days'
        ) sub
        GROUP BY cat_id
        ORDER BY usage_count DESC
        LIMIT suggestion_limit
      ),
      popular_subcategories AS (
        SELECT 
          sub_id as cat_id,
          COUNT(*) as usage_count
        FROM (
          SELECT unnest(subcategory_ids) as sub_id
          FROM filter_usage_logs
          WHERE created_at > now() - interval '7 days'
        ) sub
        GROUP BY sub_id
        ORDER BY usage_count DESC
        LIMIT suggestion_limit
      )
      SELECT 
        c.id as filter_id,
        'category' as filter_type,
        c.name as filter_name,
        'Popular this week' as reason,
        pc.usage_count,
        (pc.usage_count::numeric / NULLIF((SELECT COUNT(*) FROM filter_usage_logs WHERE created_at > now() - interval '7 days'), 0)) * 100 as relevance_score
      FROM categories c
      INNER JOIN popular_categories pc ON c.id = pc.cat_id
      
      UNION ALL
      
      SELECT 
        s.id as filter_id,
        'subcategory' as filter_type,
        s.name as filter_name,
        'Popular this week' as reason,
        ps.usage_count,
        (ps.usage_count::numeric / NULLIF((SELECT COUNT(*) FROM filter_usage_logs WHERE created_at > now() - interval '7 days'), 0)) * 100 as relevance_score
      FROM subcategories s
      INNER JOIN popular_subcategories ps ON s.id = ps.cat_id
      
      ORDER BY relevance_score DESC, usage_count DESC
      LIMIT suggestion_limit;
    END IF;
  END IF;
END;
$$;