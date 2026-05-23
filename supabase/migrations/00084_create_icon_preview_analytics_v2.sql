-- Create icon_preview_views table for tracking analytics
CREATE TABLE IF NOT EXISTS icon_preview_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  view_type text NOT NULL CHECK (view_type IN ('page_view', 'refresh_click', 'reinstall_click')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_icon_preview_views_user_id ON icon_preview_views(user_id);
CREATE INDEX IF NOT EXISTS idx_icon_preview_views_created_at ON icon_preview_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_icon_preview_views_view_type ON icon_preview_views(view_type);

-- Enable RLS
ALTER TABLE icon_preview_views ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own views
CREATE POLICY "Users can insert their own icon preview views"
  ON icon_preview_views
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all analytics
CREATE POLICY "Admins can view all icon preview views"
  ON icon_preview_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

COMMENT ON TABLE icon_preview_views IS 'Tracks user interactions with the App Icon Preview feature';
COMMENT ON COLUMN icon_preview_views.view_type IS 'Type of interaction: page_view, refresh_click, or reinstall_click';