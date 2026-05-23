-- Add banner_image_url column to stores table
ALTER TABLE stores ADD COLUMN banner_image_url text;

-- Add comment for documentation
COMMENT ON COLUMN stores.banner_image_url IS 'URL of the store banner image displayed on store detail page';