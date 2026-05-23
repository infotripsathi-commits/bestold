-- Drop the existing admin policy that uses direct EXISTS
DROP POLICY IF EXISTS "Admins can view all products" ON products;

-- Recreate the policy using the is_admin() function
CREATE POLICY "Admins can view all products"
ON products
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));