-- Add social media link columns to stores table
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- Add check constraints for valid URLs (optional but recommended)
ALTER TABLE stores
ADD CONSTRAINT youtube_url_format CHECK (youtube_url IS NULL OR youtube_url ~* '^https?://'),
ADD CONSTRAINT facebook_url_format CHECK (facebook_url IS NULL OR facebook_url ~* '^https?://'),
ADD CONSTRAINT instagram_url_format CHECK (instagram_url IS NULL OR instagram_url ~* '^https?://');

-- Add comment for documentation
COMMENT ON COLUMN stores.youtube_url IS 'Store YouTube channel or video URL';
COMMENT ON COLUMN stores.facebook_url IS 'Store Facebook page URL';
COMMENT ON COLUMN stores.instagram_url IS 'Store Instagram profile URL';