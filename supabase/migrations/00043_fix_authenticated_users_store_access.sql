-- Drop the old policy that only applies to public
DROP POLICY IF EXISTS "Everyone can view approved stores" ON stores;

-- Create a new policy that applies to BOTH public AND authenticated users
CREATE POLICY "Everyone can view approved stores"
  ON stores FOR SELECT
  TO public, authenticated
  USING (approval_status = 'approved');