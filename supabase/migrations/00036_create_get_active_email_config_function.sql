-- Create a function to get active email configuration
-- This function runs with SECURITY DEFINER, bypassing RLS
DROP FUNCTION IF EXISTS get_active_email_configuration();

CREATE OR REPLACE FUNCTION get_active_email_configuration()
RETURNS TABLE (
  id uuid,
  provider text,
  api_key text,
  sender_email text,
  sender_name text,
  is_active boolean,
  created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ec.id,
    ec.provider,
    ec.api_key,
    ec.sender_email,
    ec.sender_name,
    ec.is_active,
    ec.created_at
  FROM email_configuration ec
  WHERE ec.is_active = true
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION get_active_email_configuration() TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION get_active_email_configuration() IS 
'Returns the active email configuration for sending emails. Runs with SECURITY DEFINER to bypass RLS.';