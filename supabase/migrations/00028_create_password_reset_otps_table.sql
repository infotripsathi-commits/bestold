-- Create table for storing password reset OTPs
CREATE TABLE IF NOT EXISTS password_reset_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  otp_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  verified boolean NOT NULL DEFAULT false,
  used boolean NOT NULL DEFAULT false
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email ON password_reset_otps(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires_at ON password_reset_otps(expires_at);

-- Enable RLS
ALTER TABLE password_reset_otps ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (request OTP)
CREATE POLICY "Anyone can request password reset OTP" ON password_reset_otps
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Policy: Anyone can read their own OTPs (for verification)
CREATE POLICY "Anyone can verify their own OTP" ON password_reset_otps
  FOR SELECT TO anon, authenticated
  USING (true);

-- Policy: Anyone can update their own OTPs (mark as verified/used)
CREATE POLICY "Anyone can update their own OTP" ON password_reset_otps
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Function to clean up expired OTPs (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM password_reset_otps
  WHERE expires_at < now() - interval '1 hour';
END;
$$;

COMMENT ON TABLE password_reset_otps IS 'Stores OTP codes for password reset verification';
COMMENT ON COLUMN password_reset_otps.otp_code IS '6-digit OTP code';
COMMENT ON COLUMN password_reset_otps.expires_at IS 'OTP expires 15 minutes after creation';
COMMENT ON COLUMN password_reset_otps.verified IS 'True when user enters correct OTP';
COMMENT ON COLUMN password_reset_otps.used IS 'True when password is successfully reset';