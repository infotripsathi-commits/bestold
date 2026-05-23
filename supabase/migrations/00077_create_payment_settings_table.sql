
-- Create payment_settings table for storing payment QR code and UPI details
CREATE TABLE IF NOT EXISTS payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_url text,
  upi_id text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default payment settings
INSERT INTO payment_settings (upi_id, is_active)
VALUES ('platform@upi', true);

-- Enable RLS
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

-- Allow public to read active payment settings
CREATE POLICY "Public can read active payment settings"
ON payment_settings FOR SELECT
TO public
USING (is_active = true);

-- Allow authenticated users (admins) to manage payment settings
CREATE POLICY "Authenticated users can manage payment settings"
ON payment_settings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER update_payment_settings_updated_at
  BEFORE UPDATE ON payment_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
