-- Allow service role and Edge Functions to read active email configuration
-- This is needed for password reset and other email sending features

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Service can read active email configuration" ON email_configuration;

-- Create policy to allow reading active email configuration
-- This allows Edge Functions to access the active email config for sending emails
CREATE POLICY "Service can read active email configuration"
ON email_configuration
FOR SELECT
TO authenticated, anon
USING (is_active = true);

-- Add comment explaining the policy
COMMENT ON POLICY "Service can read active email configuration" ON email_configuration IS 
'Allows Edge Functions and services to read the active email configuration for sending emails. Only active configuration is exposed.';