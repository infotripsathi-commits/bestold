-- Drop old insert policy if exists
DROP POLICY IF EXISTS "Sellers can create stores" ON stores;
DROP POLICY IF EXISTS "Sellers can insert stores" ON stores;
DROP POLICY IF EXISTS "Authenticated users can create stores" ON stores;

-- Create new insert policy allowing sellers to create their own stores
CREATE POLICY "Sellers can create own store"
  ON stores FOR INSERT
  TO authenticated
  WITH CHECK (
    seller_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('seller', 'admin')
    )
  );

-- Drop old update policy if exists
DROP POLICY IF EXISTS "Sellers can update stores" ON stores;
DROP POLICY IF EXISTS "Sellers can update own stores" ON stores;

-- Create update policy for sellers to update their own stores
CREATE POLICY "Sellers can update own store"
  ON stores FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- Admin can update any store
CREATE POLICY "Admins can update any store"
  ON stores FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Ensure default value for approval_status
ALTER TABLE stores ALTER COLUMN approval_status SET DEFAULT 'pending';