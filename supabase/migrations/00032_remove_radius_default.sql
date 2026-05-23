-- Remove default value from radius_km column
ALTER TABLE locations
ALTER COLUMN radius_km DROP DEFAULT;

-- Update comment for documentation
COMMENT ON COLUMN locations.radius_km IS 'Coverage radius in kilometers for this location. Customers within this radius will see products from this location. No default value - admin must set explicitly.';
