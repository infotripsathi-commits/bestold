-- Create filter usage logs table
CREATE TABLE IF NOT EXISTS filter_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  category_ids uuid[] DEFAULT '{}',
  subcategory_ids uuid[] DEFAULT '{}',
  search_query text,
  location text,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_filter_usage_logs_created_at ON filter_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_filter_usage_logs_category_ids ON filter_usage_logs USING gin(category_ids);
CREATE INDEX IF NOT EXISTS idx_filter_usage_logs_subcategory_ids ON filter_usage_logs USING gin(subcategory_ids);
CREATE INDEX IF NOT EXISTS idx_filter_usage_logs_user_id ON filter_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_filter_usage_logs_session_id ON filter_usage_logs(session_id);

-- RLS policies for filter_usage_logs
ALTER TABLE filter_usage_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can insert usage logs (for tracking)
CREATE POLICY "Anyone can insert filter usage logs"
  ON filter_usage_logs
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Users can only view their own logs
CREATE POLICY "Users can view their own filter usage logs"
  ON filter_usage_logs
  FOR SELECT
  TO authenticated, anon
  USING (auth.uid() = user_id OR user_id IS NULL);