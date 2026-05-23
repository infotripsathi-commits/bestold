-- Categories: Allow both public and authenticated users to view
DROP POLICY IF EXISTS "Public can view categories" ON categories;
CREATE POLICY "Everyone can view categories"
  ON categories FOR SELECT
  USING (true);

-- Products: Allow both public and authenticated users to view active products from approved stores
DROP POLICY IF EXISTS "Public can view products from approved stores" ON products;
CREATE POLICY "Everyone can view products from approved stores"
  ON products FOR SELECT
  USING (status = 'active' AND is_store_approved(store_id));

-- Stores: Allow both public and authenticated users to view approved stores
DROP POLICY IF EXISTS "Public can view approved stores" ON stores;
CREATE POLICY "Everyone can view approved stores"
  ON stores FOR SELECT
  USING (approval_status = 'approved');