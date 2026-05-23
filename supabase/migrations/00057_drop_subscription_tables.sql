-- Drop subscription tables and related objects
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS subscription_settings CASCADE;

-- Remove subscription_status column from stores table
ALTER TABLE stores DROP COLUMN IF EXISTS subscription_status CASCADE;
ALTER TABLE stores DROP COLUMN IF EXISTS current_subscription_id CASCADE;
ALTER TABLE stores DROP COLUMN IF EXISTS subscription_expires_at CASCADE;