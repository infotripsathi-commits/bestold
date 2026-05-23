-- Add phone_pickup_available field to locations table
ALTER TABLE locations
ADD COLUMN phone_pickup_available boolean NOT NULL DEFAULT false;

-- Add comment
COMMENT ON COLUMN locations.phone_pickup_available IS 'Indicates if this location is available for Sell Your Phone pickup service';