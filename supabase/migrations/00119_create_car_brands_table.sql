CREATE TABLE car_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE car_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active car brands"
  ON car_brands FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage car brands"
  ON car_brands FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

INSERT INTO car_brands (name, display_order) VALUES
  ('Maruti Suzuki', 1),
  ('Hyundai', 2),
  ('Tata', 3),
  ('Mahindra', 4),
  ('Honda', 5),
  ('Toyota', 6),
  ('Ford', 7),
  ('Volkswagen', 8),
  ('Renault', 9),
  ('Kia', 10),
  ('Skoda', 11),
  ('MG', 12),
  ('BMW', 13),
  ('Mercedes-Benz', 14),
  ('Audi', 15),
  ('Nissan', 16),
  ('Chevrolet', 17),
  ('Jeep', 18),
  ('Datsun', 19),
  ('Mitsubishi', 20);
