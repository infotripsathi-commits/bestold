-- Add GPS coordinates to locations table
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;

-- Create index for GPS coordinates (useful for future distance-based queries)
CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON locations(latitude, longitude);

-- Add comment for documentation
COMMENT ON COLUMN locations.latitude IS 'GPS latitude coordinate for the location';
COMMENT ON COLUMN locations.longitude IS 'GPS longitude coordinate for the location';
