-- Create tables for Sell Your Phone feature

-- Phone brands table
CREATE TABLE phone_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Phone models table (linked to brands)
CREATE TABLE phone_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES phone_brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(brand_id, name)
);

-- Phone conditions table
CREATE TABLE phone_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Phone age options table
CREATE TABLE phone_age_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Phone submissions table (to track all submissions)
CREATE TABLE phone_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  brand_name text NOT NULL,
  model_name text NOT NULL,
  condition_name text NOT NULL,
  age_name text NOT NULL,
  front_image_url text NOT NULL,
  back_image_url text NOT NULL,
  customer_name text,
  customer_phone text,
  customer_email text,
  whatsapp_sent boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_phone_models_brand_id ON phone_models(brand_id);
CREATE INDEX idx_phone_brands_display_order ON phone_brands(display_order);
CREATE INDEX idx_phone_models_display_order ON phone_models(display_order);
CREATE INDEX idx_phone_conditions_display_order ON phone_conditions(display_order);
CREATE INDEX idx_phone_age_options_display_order ON phone_age_options(display_order);
CREATE INDEX idx_phone_submissions_created_at ON phone_submissions(created_at DESC);

-- Enable RLS
ALTER TABLE phone_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_age_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Public can view active options
CREATE POLICY "Anyone can view active phone brands"
  ON phone_brands FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view active phone models"
  ON phone_models FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view active phone conditions"
  ON phone_conditions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view active phone age options"
  ON phone_age_options FOR SELECT
  USING (is_active = true);

-- Anyone can submit (even anonymous users)
CREATE POLICY "Anyone can submit phone details"
  ON phone_submissions FOR INSERT
  WITH CHECK (true);

-- Users can view their own submissions
CREATE POLICY "Users can view their own submissions"
  ON phone_submissions FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Admin can manage all
CREATE POLICY "Admin can manage phone brands"
  ON phone_brands FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can manage phone models"
  ON phone_models FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can manage phone conditions"
  ON phone_conditions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can manage phone age options"
  ON phone_age_options FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can view all submissions"
  ON phone_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default data
INSERT INTO phone_brands (name, display_order) VALUES
  ('Apple', 10),
  ('Samsung', 20),
  ('Google', 30),
  ('OnePlus', 40),
  ('Xiaomi', 50),
  ('Oppo', 60),
  ('Vivo', 70),
  ('Realme', 80),
  ('Motorola', 90),
  ('Nokia', 100);

-- Insert default conditions
INSERT INTO phone_conditions (name, description, display_order) VALUES
  ('Like New', 'Excellent condition, no visible scratches', 10),
  ('Good', 'Minor scratches, fully functional', 20),
  ('Fair', 'Visible wear and tear, fully functional', 30),
  ('Poor', 'Significant damage, may have issues', 40);

-- Insert default age options
INSERT INTO phone_age_options (name, display_order) VALUES
  ('Less than 6 months', 10),
  ('6 months - 1 year', 20),
  ('1 - 2 years', 30),
  ('2 - 3 years', 40),
  ('More than 3 years', 50);

-- Add WhatsApp number to site_settings
INSERT INTO site_settings (key, value, category) VALUES
  ('whatsapp_number', '918167865019', 'general'),
  ('whatsapp_country_code', '+91', 'general'),
  ('sell_phone_enabled', 'true', 'general')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;