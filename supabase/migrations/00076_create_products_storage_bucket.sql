
-- Create products storage bucket for product images, banners, and store images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
);

-- Allow public read access to all files in products bucket
CREATE POLICY "Public read access for products bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

-- Allow authenticated users to upload files to products bucket
CREATE POLICY "Authenticated users can upload to products bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- Allow authenticated users to update their own files
CREATE POLICY "Authenticated users can update files in products bucket"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'products')
WITH CHECK (bucket_id = 'products');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete files in products bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products');
