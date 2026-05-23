-- Create email configuration table
CREATE TABLE IF NOT EXISTS email_configuration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('resend', 'sendgrid', 'aws_ses', 'custom')),
  api_key text NOT NULL,
  sender_email text NOT NULL,
  sender_name text NOT NULL DEFAULT 'BestOld',
  is_active boolean NOT NULL DEFAULT false,
  test_email_sent boolean NOT NULL DEFAULT false,
  last_tested_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_email_configuration_active ON email_configuration(is_active) WHERE is_active = true;

-- Create unique partial index to ensure only one active configuration
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_configuration_only_one_active 
  ON email_configuration(is_active) 
  WHERE is_active = true;

-- Enable RLS
ALTER TABLE email_configuration ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = uid AND role = 'admin'
  );
$$;

-- Policies: Only admins can manage email configuration
CREATE POLICY "Admins can view email configuration" ON email_configuration
  FOR SELECT TO authenticated
  USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can insert email configuration" ON email_configuration
  FOR INSERT TO authenticated
  WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Admins can update email configuration" ON email_configuration
  FOR UPDATE TO authenticated
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Admins can delete email configuration" ON email_configuration
  FOR DELETE TO authenticated
  USING (is_admin_user(auth.uid()));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_configuration_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_email_configuration_updated_at
  BEFORE UPDATE ON email_configuration
  FOR EACH ROW
  EXECUTE FUNCTION update_email_configuration_updated_at();

COMMENT ON TABLE email_configuration IS 'Stores email service configuration for sending OTP and other emails';
COMMENT ON COLUMN email_configuration.provider IS 'Email service provider: resend, sendgrid, aws_ses, or custom';
COMMENT ON COLUMN email_configuration.api_key IS 'API key for the email service (stored encrypted)';
COMMENT ON COLUMN email_configuration.sender_email IS 'Email address to send from (must be verified with provider)';
COMMENT ON COLUMN email_configuration.is_active IS 'Only one configuration can be active at a time';
COMMENT ON COLUMN email_configuration.test_email_sent IS 'Whether a test email has been successfully sent';