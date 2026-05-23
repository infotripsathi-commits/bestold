-- Function to create a profile if it doesn't exist
-- This is a fallback for cases where the trigger didn't run
CREATE OR REPLACE FUNCTION create_profile_if_not_exists(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT DEFAULT '',
  p_role user_role DEFAULT 'buyer'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile profiles;
  v_result JSONB;
BEGIN
  -- Check if profile exists
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = p_user_id;

  IF v_profile.id IS NOT NULL THEN
    -- Profile exists, return it
    v_result := jsonb_build_object(
      'success', true,
      'created', false,
      'profile', row_to_json(v_profile)
    );
  ELSE
    -- Profile doesn't exist, create it
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (p_user_id, p_email, p_full_name, p_role)
    RETURNING * INTO v_profile;

    v_result := jsonb_build_object(
      'success', true,
      'created', true,
      'profile', row_to_json(v_profile)
    );
  END IF;

  RETURN v_result;
EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;