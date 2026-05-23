-- Add shop images, trade license, GPS location, and phone number to stores table
ALTER TABLE stores ADD COLUMN shop_images text[] DEFAULT '{}';
ALTER TABLE stores ADD COLUMN trade_license_url text;
ALTER TABLE stores ADD COLUMN latitude numeric(10, 8);
ALTER TABLE stores ADD COLUMN longitude numeric(11, 8);
ALTER TABLE stores ADD COLUMN phone_number text;

-- Add comments for documentation
COMMENT ON COLUMN stores.shop_images IS 'Array of shop image URLs (max 5 images)';
COMMENT ON COLUMN stores.trade_license_url IS 'URL of trade license document image for verification';
COMMENT ON COLUMN stores.latitude IS 'GPS latitude coordinate of store location';
COMMENT ON COLUMN stores.longitude IS 'GPS longitude coordinate of store location';
COMMENT ON COLUMN stores.phone_number IS 'Seller contact phone number displayed to customers';

-- Create index for location-based queries
CREATE INDEX idx_stores_location ON stores(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;