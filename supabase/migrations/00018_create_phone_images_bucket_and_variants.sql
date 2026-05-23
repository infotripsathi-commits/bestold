-- Create storage bucket for phone images
INSERT INTO storage.buckets (id, name, public)
VALUES ('phone-images', 'phone-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for phone images bucket
CREATE POLICY "Anyone can view phone images"
ON storage.objects FOR SELECT
USING (bucket_id = 'phone-images');

CREATE POLICY "Authenticated users can upload phone images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'phone-images' 
  AND (auth.role() = 'authenticated' OR auth.role() = 'anon')
);

CREATE POLICY "Users can update their own phone images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'phone-images');

CREATE POLICY "Users can delete their own phone images"
ON storage.objects FOR DELETE
USING (bucket_id = 'phone-images');

-- Create phone variants table
CREATE TABLE phone_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index
CREATE INDEX idx_phone_variants_display_order ON phone_variants(display_order);

-- Enable RLS
ALTER TABLE phone_variants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for variants
CREATE POLICY "Anyone can view active phone variants"
  ON phone_variants FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can manage phone variants"
  ON phone_variants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default variants
INSERT INTO phone_variants (name, display_order) VALUES
  ('3GB/32GB', 10),
  ('4GB/64GB', 20),
  ('6GB/128GB', 30),
  ('8GB/128GB', 40),
  ('8GB/256GB', 50),
  ('12GB/256GB', 60),
  ('12GB/512GB', 70),
  ('16GB/512GB', 80),
  ('16GB/1TB', 90);

-- Update phone_submissions table to support 6 images and variant
ALTER TABLE phone_submissions 
  ADD COLUMN variant_name text,
  ADD COLUMN image_1_url text,
  ADD COLUMN image_2_url text,
  ADD COLUMN image_3_url text,
  ADD COLUMN image_4_url text,
  ADD COLUMN image_5_url text,
  ADD COLUMN image_6_url text;

-- Migrate existing data (front_image_url -> image_1_url, back_image_url -> image_2_url)
UPDATE phone_submissions 
SET 
  image_1_url = front_image_url,
  image_2_url = back_image_url
WHERE front_image_url IS NOT NULL OR back_image_url IS NOT NULL;

-- Keep old columns for backward compatibility (can be removed later)
-- ALTER TABLE phone_submissions DROP COLUMN front_image_url;
-- ALTER TABLE phone_submissions DROP COLUMN back_image_url;