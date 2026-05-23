-- Drop the existing "ALL" policy for admins and create separate policies
DROP POLICY IF EXISTS "Admins can manage subscription plans" ON subscription_plans;

-- Create explicit SELECT policy for admins (can view all plans including inactive)
CREATE POLICY "Admins can view all subscription plans"
ON subscription_plans
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Create INSERT policy for admins
CREATE POLICY "Admins can create subscription plans"
ON subscription_plans
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Create UPDATE policy for admins
CREATE POLICY "Admins can update subscription plans"
ON subscription_plans
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Create DELETE policy for admins
CREATE POLICY "Admins can delete subscription plans"
ON subscription_plans
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);