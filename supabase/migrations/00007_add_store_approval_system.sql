-- Add approval status to stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE stores ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES profiles(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_stores_approval_status ON stores(approval_status);

-- Update existing stores to approved (for backward compatibility)
UPDATE stores SET approval_status = 'approved', approved_at = created_at WHERE approval_status = 'pending';

-- Drop existing public view policies for stores
DROP POLICY IF EXISTS "Anyone can view stores" ON stores;
DROP POLICY IF EXISTS "Anyone can view active stores" ON stores;

-- Create new policy: only approved stores are visible to public
CREATE POLICY "Public can view approved stores"
  ON stores FOR SELECT
  USING (approval_status = 'approved');

-- Sellers can view their own stores regardless of status
CREATE POLICY "Sellers can view own stores"
  ON stores FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

-- Admins can view all stores
CREATE POLICY "Admins can view all stores"
  ON stores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Update products visibility - only show products from approved stores
DROP POLICY IF EXISTS "Anyone can view active products" ON products;

CREATE POLICY "Public can view products from approved stores"
  ON products FOR SELECT
  USING (
    status = 'active' 
    AND EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = products.store_id
      AND stores.approval_status = 'approved'
    )
  );

-- Sellers can view their own products
CREATE POLICY "Sellers can view own products"
  ON products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = products.store_id
      AND stores.seller_id = auth.uid()
    )
  );

-- Admins can view all products
CREATE POLICY "Admins can view all products"
  ON products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create function to approve store
CREATE OR REPLACE FUNCTION approve_store(
  store_id_param uuid,
  admin_id_param uuid
)
RETURNS void AS $$
BEGIN
  UPDATE stores
  SET 
    approval_status = 'approved',
    approved_at = now(),
    approved_by = admin_id_param
  WHERE id = store_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to reject store
CREATE OR REPLACE FUNCTION reject_store(
  store_id_param uuid,
  admin_id_param uuid,
  reason_param text
)
RETURNS void AS $$
BEGIN
  UPDATE stores
  SET 
    approval_status = 'rejected',
    rejection_reason = reason_param,
    approved_by = admin_id_param
  WHERE id = store_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;