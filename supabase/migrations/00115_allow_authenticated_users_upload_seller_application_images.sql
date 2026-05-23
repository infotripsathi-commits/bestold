
-- Allow any authenticated user to upload images for their seller application
-- (store-banners, shop-images, trade-licenses paths)
-- This is needed because applicants have role='user', not yet 'seller'
CREATE POLICY "Authenticated users can upload seller application images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'app-ahn8efyun8ch_products_images'
  AND (
    name LIKE 'store-banners/%'
    OR name LIKE 'shop-images/%'
    OR name LIKE 'trade-licenses/%'
  )
);

-- Allow authenticated users to update (overwrite) their seller application uploads
CREATE POLICY "Authenticated users can update seller application images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'app-ahn8efyun8ch_products_images'
  AND (
    name LIKE 'store-banners/%'
    OR name LIKE 'shop-images/%'
    OR name LIKE 'trade-licenses/%'
  )
)
WITH CHECK (
  bucket_id = 'app-ahn8efyun8ch_products_images'
  AND (
    name LIKE 'store-banners/%'
    OR name LIKE 'shop-images/%'
    OR name LIKE 'trade-licenses/%'
  )
);
