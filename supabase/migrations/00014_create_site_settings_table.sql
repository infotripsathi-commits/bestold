-- Create site_settings table for managing footer and other site-wide settings
create table site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text,
  category text not null default 'general',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create index on key for fast lookups
create index idx_site_settings_key on site_settings(key);
create index idx_site_settings_category on site_settings(category);

-- Enable RLS
alter table site_settings enable row level security;

-- Public can read all settings
create policy "Anyone can view site settings"
  on site_settings for select
  using (true);

-- Admin can manage settings
create policy "Admin can manage site settings"
  on site_settings for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Insert default footer settings
insert into site_settings (key, value, category) values
  ('footer_about_us', 'BestOld is your trusted marketplace for buying and selling quality second-hand goods. We connect buyers and sellers in a safe, convenient platform.', 'footer'),
  ('footer_address', '123 Market Street, San Francisco, CA 94103', 'footer'),
  ('footer_phone', '+1 (555) 123-4567', 'footer'),
  ('footer_email', 'contact@bestold.com', 'footer'),
  ('footer_instagram', 'https://instagram.com/bestold', 'footer'),
  ('footer_facebook', 'https://facebook.com/bestold', 'footer'),
  ('footer_youtube', 'https://youtube.com/@bestold', 'footer'),
  ('footer_twitter', 'https://twitter.com/bestold', 'footer'),
  ('footer_privacy_policy', '/privacy-policy', 'footer'),
  ('footer_terms_conditions', '/terms-conditions', 'footer'),
  ('footer_about_page', '/about', 'footer'),
  ('site_name', 'BestOld', 'general'),
  ('site_tagline', 'Buy & Sell Second-Hand Goods', 'general'),
  ('footer_copyright', '© 2026 BestOld. All rights reserved.', 'footer')
on conflict (key) do nothing;