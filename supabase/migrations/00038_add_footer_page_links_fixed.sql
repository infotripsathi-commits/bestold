-- Add footer page link settings
INSERT INTO public.site_settings (category, key, value)
VALUES 
  ('footer', 'footer_about_page', '/about'),
  ('footer', 'footer_privacy_policy', '/privacy'),
  ('footer', 'footer_terms_conditions', '/terms')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;