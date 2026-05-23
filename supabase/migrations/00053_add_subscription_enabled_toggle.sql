-- Add enabled field to subscription_settings to control global subscription feature
ALTER TABLE subscription_settings
ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT true;

-- Update existing row to have enabled = true
UPDATE subscription_settings
SET enabled = true
WHERE id = '00000000-0000-0000-0000-000000000001';