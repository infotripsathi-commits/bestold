-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

-- Add INSERT policy for profiles
CREATE POLICY "Service role can insert profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);