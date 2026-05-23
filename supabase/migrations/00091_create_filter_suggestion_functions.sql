-- Function to get filter suggestions based on current selection
CREATE OR REPLACE FUNCTION get_filter_suggestions(
  current_category_ids uuid[] DEFAULT '{}',
  current_subcategory_ids uuid[] DEFAULT '{}',
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
  -- If user has selections, find what others selected together with these
  IF array_length(current_category_ids, 1) > 0 OR array_length(current_subcategory_ids, 1) > 0 THEN
    RETURN QUERY
    WITH co_occurring_filters AS (
      -- Find filters that co-occur with current selection
      SELECT 
        unnest(category_ids) as cat_id,
        COUNT(*) as occurrence_count
      FROM filter_usage_logs
      WHERE 
        created_at > now() - interval '30 days'
        AND (
          category_ids && current_category_ids 
          OR subcategory_ids && current_subcategory_ids
        )
      GROUP BY cat_id
      HAVING unnest(category_ids) != ALL(current_category_ids)
      
      UNION ALL
      
      SELECT 
        unnest(subcategory_ids) as cat_id,
        COUNT(*) as occurrence_count
      FROM filter_usage_logs
      WHERE 
        created_at > now() - interval '30 days'
        AND (
          category_ids && current_category_ids 
          OR subcategory_ids && current_subcategory_ids
        )
      GROUP BY cat_id
      HAVING unnest(subcategory_ids) != ALL(current_subcategory_ids)
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
      LEFT JOIN co_occurring_filters cof ON c.id = cof.cat_id
      WHERE cof.occurrence_count > 0
      
      UNION ALL
      
      SELECT 
        s.id as filter_id,
        'subcategory' as filter_type,
        s.name as filter_name,
        'Often selected together' as reason,
        COALESCE(cof.occurrence_count, 0) as usage_count,
        (COALESCE(cof.occurrence_count, 0)::numeric / NULLIF((SELECT COUNT(*) FROM filter_usage_logs WHERE created_at > now() - interval '30 days'), 0)) * 100 as relevance_score
      FROM subcategories s
      LEFT JOIN co_occurring_filters cof ON s.id = cof.cat_id
      WHERE cof.occurrence_count > 0
    )
    SELECT * FROM suggestions_with_names
    ORDER BY relevance_score DESC, usage_count DESC
    LIMIT suggestion_limit;
  
  -- If no selections, show popular filters
  ELSE
    RETURN QUERY
    WITH popular_categories AS (
      SELECT 
        unnest(category_ids) as cat_id,
        COUNT(*) as usage_count
      FROM filter_usage_logs
      WHERE created_at > now() - interval '7 days'
      GROUP BY cat_id
      ORDER BY usage_count DESC
      LIMIT suggestion_limit
    ),
    popular_subcategories AS (
      SELECT 
        unnest(subcategory_ids) as cat_id,
        COUNT(*) as usage_count
      FROM filter_usage_logs
      WHERE created_at > now() - interval '7 days'
      GROUP BY cat_id
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
END;
$$;