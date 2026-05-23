-- Drop the old policy that only applies to public
DROP POLICY IF EXISTS "Everyone can view categories" ON categories;

-- Create a new policy that applies to BOTH public AND authenticated users
CREATE POLICY "Everyone can view categories"
  ON categories FOR SELECT
  TO public, authenticated
  USING (true);