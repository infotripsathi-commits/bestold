-- Create suggestion clicks table for CTR tracking
CREATE TABLE IF NOT EXISTS suggestion_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  filter_id uuid NOT NULL,
  filter_type text NOT NULL CHECK (filter_type IN ('category', 'subcategory')),
  filter_name text NOT NULL,
  suggestion_reason text NOT NULL,
  clicked_at timestamptz DEFAULT now()
);

-- Create personalization config table
CREATE TABLE IF NOT EXISTS personalization_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text UNIQUE NOT NULL,
  config_value numeric NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Insert default configuration values
INSERT INTO personalization_config (config_key, config_value, description)
VALUES 
  ('view_weight', 1.0, 'Weight multiplier for product views'),
  ('favorite_weight', 2.0, 'Weight multiplier for favorited products'),
  ('purchase_weight', 3.0, 'Weight multiplier for purchased products'),
  ('time_decay_7d', 1.0, 'Time decay multiplier for last 7 days'),
  ('time_decay_30d', 0.7, 'Time decay multiplier for 8-30 days'),
  ('time_decay_90d', 0.4, 'Time decay multiplier for 31-90 days'),
  ('time_decay_180d', 0.2, 'Time decay multiplier for 91-180 days'),
  ('suggestion_limit', 5, 'Maximum number of suggestions to show'),
  ('preference_limit', 10, 'Maximum number of preferences to analyze')
ON CONFLICT (config_key) DO NOTHING;

-- Add indexes for suggestion_clicks
CREATE INDEX IF NOT EXISTS idx_suggestion_clicks_user_id ON suggestion_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_clicks_filter_id ON suggestion_clicks(filter_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_clicks_clicked_at ON suggestion_clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_suggestion_clicks_session_id ON suggestion_clicks(session_id);

-- Add index for personalization_config
CREATE INDEX IF NOT EXISTS idx_personalization_config_key ON personalization_config(config_key);

-- RLS policies for suggestion_clicks
ALTER TABLE suggestion_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert suggestion clicks"
  ON suggestion_clicks
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Admins can view all suggestion clicks"
  ON suggestion_clicks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS policies for personalization_config
ALTER TABLE personalization_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view config"
  ON personalization_config
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update config"
  ON personalization_config
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );