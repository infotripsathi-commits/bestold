-- Drop the existing admin policy that uses direct EXISTS
DROP POLICY IF EXISTS "Admins can view all stores" ON stores;

-- Recreate the policy using the is_admin() function
CREATE POLICY "Admins can view all stores"
ON stores
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));