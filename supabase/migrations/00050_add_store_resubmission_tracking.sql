-- Add resubmission tracking to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS resubmission_count INTEGER DEFAULT 0;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS last_resubmitted_at TIMESTAMP WITH TIME ZONE;

-- Add comment
COMMENT ON COLUMN stores.resubmission_count IS 'Number of times store was resubmitted after rejection';
COMMENT ON COLUMN stores.last_resubmitted_at IS 'Timestamp of last resubmission';