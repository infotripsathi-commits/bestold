-- Drop and recreate with personalization support
DROP FUNCTION IF EXISTS get_filter_suggestions(uuid[], uuid[], int);

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
    ),
    personalized_suggestions AS (
      -- Category suggestions based on user preferences
      SELECT 
        c.id as filter_id,
        'category' as filter_type,
        c.name as filter_name,
        'Based on your activity' as reason,
        up.view_count + up.purchase_count + up.wishlist_count as usage_count,
        up.preference_score as relevance_score
      FROM categories c
      INNER JOIN user_preferences up ON c.id = up.category_id
      WHERE up.category_id IS NOT NULL
        AND c.id != ALL(current_category_ids)
      
      UNION ALL
      
      -- Subcategory suggestions based on user preferences
      SELECT 
        s.id as filter_id,
        'subcategory' as filter_type,
        s.name as filter_name,
        'Based on your activity' as reason,
        up.view_count + up.purchase_count + up.wishlist_count as usage_count,
        up.preference_score as relevance_score
      FROM subcategories s
      INNER JOIN user_preferences up ON s.id = up.subcategory_id
      WHERE up.subcategory_id IS NOT NULL
        AND s.id != ALL(current_subcategory_ids)
    ),
    co_occurring_suggestions AS (
      -- Also include co-occurring filters if user has current selection
      SELECT 
        cat_id as filter_id,
        filter_type,
        filter_name,
        'Often selected together' as reason,
        occurrence_count as usage_count,
        (occurrence_count::numeric / NULLIF((SELECT COUNT(*) FROM filter_usage_logs WHERE created_at > now() - interval '30 days'), 0)) * 100 * 0.5 as relevance_score
      FROM (
        SELECT 
          c.id as cat_id,
          'category' as filter_type,
          c.name as filter_name,
          COUNT(*) as occurrence_count
        FROM filter_usage_logs ful
        CROSS JOIN LATERAL unnest(ful.category_ids) as cat_id
        INNER JOIN categories c ON c.id = cat_id
        WHERE ful.created_at > now() - interval '30 days'
          AND (
            (array_length(current_category_ids, 1) > 0 AND ful.category_ids && current_category_ids)
            OR (array_length(current_subcategory_ids, 1) > 0 AND ful.subcategory_ids && current_subcategory_ids)
          )
          AND cat_id != ALL(current_category_ids)
        GROUP BY c.id, c.name
        
        UNION ALL
        
        SELECT 
          s.id as cat_id,
          'subcategory' as filter_type,
          s.name as filter_name,
          COUNT(*) as occurrence_count
        FROM filter_usage_logs ful
        CROSS JOIN LATERAL unnest(ful.subcategory_ids) as sub_id
        INNER JOIN subcategories s ON s.id = sub_id
        WHERE ful.created_at > now() - interval '30 days'
          AND (
            (array_length(current_category_ids, 1) > 0 AND ful.category_ids && current_category_ids)
            OR (array_length(current_subcategory_ids, 1) > 0 AND ful.subcategory_ids && current_subcategory_ids)
          )
          AND sub_id != ALL(current_subcategory_ids)
        GROUP BY s.id, s.name
      ) sub
    ),
    all_suggestions AS (
      SELECT * FROM personalized_suggestions
      UNION ALL
      SELECT * FROM co_occurring_suggestions
      WHERE array_length(current_category_ids, 1) > 0 OR array_length(current_subcategory_ids, 1) > 0
    )
    SELECT DISTINCT ON (filter_id) *
    FROM all_suggestions
    ORDER BY filter_id, relevance_score DESC
    LIMIT suggestion_limit;
  
  -- If no user or no personalization data, use original logic
  ELSE
    -- Original suggestion logic (co-occurrence or popular)
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