
-- Add per-store pickup payment fields
ALTER TABLE stores
  ADD COLUMN pickup_qr_code_url text DEFAULT NULL,
  ADD COLUMN pickup_upi_id text DEFAULT NULL;

-- Allow sellers (authenticated users) to upload their pickup QR code images
CREATE POLICY "Authenticated users can upload pickup qr images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'app-ahn8efyun8ch_products_images'
  AND name LIKE 'pickup-qr/%'
);

CREATE POLICY "Authenticated users can update pickup qr images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'app-ahn8efyun8ch_products_images'
  AND name LIKE 'pickup-qr/%'
)
WITH CHECK (
  bucket_id = 'app-ahn8efyun8ch_products_images'
  AND name LIKE 'pickup-qr/%'
);
