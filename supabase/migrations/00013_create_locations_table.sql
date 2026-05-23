-- Create locations table for admin-managed locations
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value text NOT NULL UNIQUE,
  label text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_locations_display_order ON locations(display_order);
CREATE INDEX IF NOT EXISTS idx_locations_is_active ON locations(is_active);

-- Enable RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Public can view active locations
CREATE POLICY "Anyone can view active locations"
  ON locations FOR SELECT
  USING (is_active = true);

-- Admin can manage all locations
CREATE POLICY "Admin can manage locations"
  ON locations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert existing locations as seed data
INSERT INTO locations (value, label, display_order) VALUES
  ('new-york-ny', 'New York, NY', 0),
  ('los-angeles-ca', 'Los Angeles, CA', 10),
  ('chicago-il', 'Chicago, IL', 20),
  ('houston-tx', 'Houston, TX', 30),
  ('phoenix-az', 'Phoenix, AZ', 40),
  ('philadelphia-pa', 'Philadelphia, PA', 50),
  ('san-antonio-tx', 'San Antonio, TX', 60),
  ('san-diego-ca', 'San Diego, CA', 70),
  ('dallas-tx', 'Dallas, TX', 80),
  ('san-jose-ca', 'San Jose, CA', 90),
  ('austin-tx', 'Austin, TX', 100),
  ('jacksonville-fl', 'Jacksonville, FL', 110),
  ('fort-worth-tx', 'Fort Worth, TX', 120),
  ('columbus-oh', 'Columbus, OH', 130),
  ('charlotte-nc', 'Charlotte, NC', 140),
  ('san-francisco-ca', 'San Francisco, CA', 150),
  ('indianapolis-in', 'Indianapolis, IN', 160),
  ('seattle-wa', 'Seattle, WA', 170),
  ('denver-co', 'Denver, CO', 180),
  ('boston-ma', 'Boston, MA', 190),
  ('nashville-tn', 'Nashville, TN', 200),
  ('detroit-mi', 'Detroit, MI', 210),
  ('portland-or', 'Portland, OR', 220),
  ('las-vegas-nv', 'Las Vegas, NV', 230),
  ('miami-fl', 'Miami, FL', 240),
  ('atlanta-ga', 'Atlanta, GA', 250)
ON CONFLICT (value) DO NOTHING;