
ALTER TABLE seller_applications
  ADD COLUMN business_type text NOT NULL DEFAULT 'retail',
  ADD COLUMN youtube_url text,
  ADD COLUMN facebook_url text,
  ADD COLUMN instagram_url text;
