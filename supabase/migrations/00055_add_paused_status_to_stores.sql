-- Drop the existing constraint
ALTER TABLE stores DROP CONSTRAINT IF EXISTS stores_approval_status_check;

-- Add new constraint with 'paused' status
ALTER TABLE stores ADD CONSTRAINT stores_approval_status_check 
  CHECK (approval_status IN ('pending', 'approved', 'rejected', 'paused'));