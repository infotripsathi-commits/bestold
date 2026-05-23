-- Create store_banners table for advertising
CREATE TABLE store_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  banner_image_url text NOT NULL,
  title text,
  description text,
  display_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_store_banners_store_id ON store_banners(store_id);
CREATE INDEX idx_store_banners_active ON store_banners(is_active);
CREATE INDEX idx_store_banners_display_order ON store_banners(display_order);

-- RLS Policies
ALTER TABLE store_banners ENABLE ROW LEVEL SECURITY;

-- Anyone can view active banners
CREATE POLICY "Anyone can view active banners"
  ON store_banners FOR SELECT
  USING (is_active = true AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()));

-- Store owners can manage their banners
CREATE POLICY "Store owners can manage their banners"
  ON store_banners FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = store_banners.store_id
      AND stores.seller_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = store_banners.store_id
      AND stores.seller_id = auth.uid()
    )
  );

-- Admins can manage all banners
CREATE POLICY "Admins can manage all banners"
  ON store_banners FOR ALL
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_store_banners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_store_banners_updated_at
  BEFORE UPDATE ON store_banners
  FOR EACH ROW
  EXECUTE FUNCTION update_store_banners_updated_at();