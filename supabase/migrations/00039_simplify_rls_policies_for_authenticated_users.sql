-- Drop the duplicate authenticated user policy for products
DROP POLICY IF EXISTS "Authenticated users can view products from approved stores" ON products;

-- Drop the duplicate public policy for categories
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;

-- Ensure categories are viewable by everyone (public and authenticated)
DROP POLICY IF EXISTS "Public can view categories" ON categories;
CREATE POLICY "Public can view categories"
  ON categories FOR SELECT
  TO public, authenticated
  USING (true);

-- Ensure products are viewable by everyone (public and authenticated)  
DROP POLICY IF EXISTS "Public can view products from approved stores" ON products;
CREATE POLICY "Public can view products from approved stores"
  ON products FOR SELECT
  TO public, authenticated
  USING (status = 'active' AND is_store_approved(store_id));

-- Ensure stores are viewable by everyone (public and authenticated)
DROP POLICY IF EXISTS "Public can view approved stores" ON stores;
CREATE POLICY "Public can view approved stores"
  ON stores FOR SELECT
  TO public, authenticated
  USING (approval_status = 'approved');