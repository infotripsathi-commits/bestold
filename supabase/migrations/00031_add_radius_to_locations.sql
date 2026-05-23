-- Add radius_km field to locations table
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS radius_km integer DEFAULT 10;

-- Add check constraint to ensure radius is positive
ALTER TABLE locations
ADD CONSTRAINT check_radius_positive CHECK (radius_km IS NULL OR radius_km > 0);

-- Add comment for documentation
COMMENT ON COLUMN locations.radius_km IS 'Coverage radius in kilometers for this location. Customers within this radius will see products from this location.';
