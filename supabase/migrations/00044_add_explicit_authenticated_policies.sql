-- Add explicit policies for authenticated users to view public data

-- Products: Authenticated users can view active products from approved stores
CREATE POLICY "Authenticated users can view active products"
  ON products FOR SELECT
  TO authenticated
  USING (status = 'active' AND is_store_approved(store_id));

-- Categories: Authenticated users can view all categories
CREATE POLICY "Authenticated users can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

-- Stores: Authenticated users can view approved stores  
CREATE POLICY "Authenticated users can view stores"
  ON stores FOR SELECT
  TO authenticated
  USING (approval_status = 'approved');