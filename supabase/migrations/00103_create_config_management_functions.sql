-- Function to get current configuration
CREATE OR REPLACE FUNCTION get_personalization_config()
RETURNS TABLE (
  config_key text,
  config_value numeric,
  description text,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.config_key,
    pc.config_value,
    pc.description,
    pc.updated_at
  FROM personalization_config pc
  ORDER BY 
    CASE pc.config_key
      WHEN 'view_weight' THEN 1
      WHEN 'favorite_weight' THEN 2
      WHEN 'purchase_weight' THEN 3
      WHEN 'time_decay_7d' THEN 4
      WHEN 'time_decay_30d' THEN 5
      WHEN 'time_decay_90d' THEN 6
      WHEN 'time_decay_180d' THEN 7
      WHEN 'suggestion_limit' THEN 8
      WHEN 'preference_limit' THEN 9
      ELSE 10
    END;
END;
$$;

-- Function to update configuration
CREATE OR REPLACE FUNCTION update_personalization_config(
  p_config_key text,
  p_config_value numeric,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Check if user is admin
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_user_id AND role = 'admin'
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only admins can update configuration';
  END IF;
  
  -- Validate config value
  IF p_config_value < 0 THEN
    RAISE EXCEPTION 'Configuration value must be non-negative';
  END IF;
  
  -- Validate specific constraints
  IF p_config_key LIKE 'time_decay_%' AND p_config_value > 1.0 THEN
    RAISE EXCEPTION 'Time decay values must be between 0 and 1';
  END IF;
  
  IF p_config_key IN ('suggestion_limit', 'preference_limit') AND p_config_value > 50 THEN
    RAISE EXCEPTION 'Limit values must be between 0 and 50';
  END IF;
  
  -- Update the configuration
  UPDATE personalization_config
  SET 
    config_value = p_config_value,
    updated_at = now(),
    updated_by = p_user_id
  WHERE config_key = p_config_key;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Configuration key not found: %', p_config_key;
  END IF;
  
  RETURN true;
END;
$$;

-- Function to get config value by key (helper for other functions)
CREATE OR REPLACE FUNCTION get_config_value(p_config_key text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_value numeric;
BEGIN
  SELECT config_value INTO v_value
  FROM personalization_config
  WHERE config_key = p_config_key;
  
  RETURN COALESCE(v_value, 0);
END;
$$;