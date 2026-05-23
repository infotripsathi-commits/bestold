-- Add location fields to phone_submissions table
ALTER TABLE phone_submissions 
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS location_address text,
  ADD COLUMN IF NOT EXISTS location_city text,
  ADD COLUMN IF NOT EXISTS location_country text;

-- Create index for location queries
CREATE INDEX IF NOT EXISTS idx_phone_submissions_location ON phone_submissions(latitude, longitude);

-- Add comment
COMMENT ON COLUMN phone_submissions.latitude IS 'GPS latitude coordinate';
COMMENT ON COLUMN phone_submissions.longitude IS 'GPS longitude coordinate';
COMMENT ON COLUMN phone_submissions.location_address IS 'Full address from GPS';
COMMENT ON COLUMN phone_submissions.location_city IS 'City name from GPS';
COMMENT ON COLUMN phone_submissions.location_country IS 'Country name from GPS';