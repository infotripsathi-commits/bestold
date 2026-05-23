-- Create product views table for browsing history
CREATE TABLE IF NOT EXISTS product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id uuid REFERENCES subcategories(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  viewed_at timestamptz DEFAULT now()
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_product_views_user_id ON product_views(user_id);
CREATE INDEX IF NOT EXISTS idx_product_views_product_id ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_category_id ON product_views(category_id);
CREATE INDEX IF NOT EXISTS idx_product_views_subcategory_id ON product_views(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_product_views_viewed_at ON product_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_views_user_viewed ON product_views(user_id, viewed_at DESC);

-- RLS policies
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert their own views
CREATE POLICY "Users can insert their own product views"
  ON product_views
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Users can view their own history
CREATE POLICY "Users can view their own product views"
  ON product_views
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);