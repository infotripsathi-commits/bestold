-- Create platform settings table

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id)
);

-- Insert default delivery charge
INSERT INTO public.platform_settings (setting_key, setting_value, description)
VALUES 
  ('delivery_charge', '50', 'Default delivery charge in rupees'),
  ('platform_fee_percentage', '2', 'Platform fee percentage on orders'),
  ('min_order_amount', '100', 'Minimum order amount in rupees')
ON CONFLICT (setting_key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON public.platform_settings(setting_key);

-- Add RLS policies
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read settings
CREATE POLICY "Anyone can read platform settings"
  ON public.platform_settings
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Only admins can update settings
CREATE POLICY "Only admins can update platform settings"
  ON public.platform_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can insert settings
CREATE POLICY "Only admins can insert platform settings"
  ON public.platform_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

COMMENT ON TABLE public.platform_settings IS 'Platform-wide configuration settings';
COMMENT ON COLUMN public.platform_settings.setting_key IS 'Unique identifier for the setting';
COMMENT ON COLUMN public.platform_settings.setting_value IS 'Value of the setting (stored as text)';
