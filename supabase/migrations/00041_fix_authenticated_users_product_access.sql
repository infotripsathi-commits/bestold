-- Drop the old policy that only applies to public
DROP POLICY IF EXISTS "Everyone can view products from approved stores" ON products;

-- Create a new policy that applies to BOTH public AND authenticated users
CREATE POLICY "Everyone can view products from approved stores"
  ON products FOR SELECT
  TO public, authenticated
  USING (status = 'active' AND is_store_approved(store_id));