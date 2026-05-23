-- Insert default subscription settings with UPI ID
INSERT INTO subscription_settings (id, upi_id, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'bestold@upi',
  NOW()
)
ON CONFLICT (id) DO UPDATE 
SET upi_id = EXCLUDED.upi_id,
    updated_at = NOW();