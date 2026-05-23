-- Bike brands table
CREATE TABLE bike_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bike_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active bike brands"
  ON bike_brands FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage bike brands"
  ON bike_brands FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed popular bike brands
INSERT INTO bike_brands (name, display_order) VALUES
  ('Hero', 1),
  ('Honda', 2),
  ('Bajaj', 3),
  ('TVS', 4),
  ('Royal Enfield', 5),
  ('Yamaha', 6),
  ('Suzuki', 7),
  ('KTM', 8),
  ('Kawasaki', 9),
  ('Jawa', 10),
  ('Benelli', 11),
  ('Triumph', 12),
  ('Harley-Davidson', 13),
  ('Ducati', 14),
  ('BMW Motorrad', 15),
  ('Mahindra', 16),
  ('Aprilia', 17),
  ('Vespa', 18),
  ('Ather', 19),
  ('Ola Electric', 20);

-- Add bike_details column to products
ALTER TABLE products ADD COLUMN bike_details jsonb DEFAULT NULL;
