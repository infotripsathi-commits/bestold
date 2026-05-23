-- Allow authenticated users to read subscription settings (for UPI payment info)
CREATE POLICY "Authenticated users can view subscription settings"
ON subscription_settings
FOR SELECT
TO authenticated
USING (true);