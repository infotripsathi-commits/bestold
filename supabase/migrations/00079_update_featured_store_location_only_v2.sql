
-- First, delete any applications that reference state-wide or nationwide plans
DELETE FROM featured_store_applications 
WHERE plan_id IN (
  SELECT id FROM featured_store_plans 
  WHERE target_type IN ('state', 'nationwide')
);

-- Now remove state-wide and nationwide plans
DELETE FROM featured_store_plans WHERE target_type IN ('state', 'nationwide');

-- Drop the state column from applications
ALTER TABLE featured_store_applications 
  DROP COLUMN IF EXISTS state;

-- Drop the old function
DROP FUNCTION IF EXISTS get_featured_stores_by_location(uuid, text);

-- Create updated function to get featured stores within 50km radius sorted by distance
CREATE OR REPLACE FUNCTION get_featured_stores_by_location(
  p_customer_lat numeric,
  p_customer_lng numeric,
  p_radius_km numeric DEFAULT 50
)
RETURNS TABLE (
  store_id uuid,
  store_name text,
  store_description text,
  store_logo_url text,
  store_latitude numeric,
  store_longitude numeric,
  banner_url text,
  location_name text,
  location_id uuid,
  distance_km numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as store_id,
    s.name as store_name,
    s.description as store_description,
    s.logo_url as store_logo_url,
    s.latitude as store_latitude,
    s.longitude as store_longitude,
    sb.image_url as banner_url,
    l.name as location_name,
    l.id as location_id,
    -- Calculate distance using Haversine formula
    (
      6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(p_customer_lat)) * 
          cos(radians(s.latitude)) * 
          cos(radians(s.longitude) - radians(p_customer_lng)) + 
          sin(radians(p_customer_lat)) * 
          sin(radians(s.latitude))
        ))
      )
    )::numeric as distance_km
  FROM featured_store_applications fsa
  JOIN stores s ON fsa.store_id = s.id
  JOIN featured_store_plans fsp ON fsa.plan_id = fsp.id
  JOIN locations l ON fsa.location_id = l.id
  LEFT JOIN store_banners sb ON s.id = sb.store_id AND sb.is_active = true
  WHERE fsa.status = 'approved'
    AND fsa.start_date <= now()
    AND fsa.end_date >= now()
    AND s.is_active = true
    AND s.latitude IS NOT NULL
    AND s.longitude IS NOT NULL
    AND fsa.location_id IS NOT NULL
    -- Filter by radius using Haversine formula
    AND (
      6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(p_customer_lat)) * 
          cos(radians(s.latitude)) * 
          cos(radians(s.longitude) - radians(p_customer_lng)) + 
          sin(radians(p_customer_lat)) * 
          sin(radians(s.latitude))
        ))
      )
    ) <= p_radius_km
  ORDER BY distance_km ASC;
END;
$$;
