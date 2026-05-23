-- Create product_analytics table for tracking user interactions
CREATE TABLE IF NOT EXISTS product_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('view', 'buy_click', 'chat_click', 'whatsapp_click', 'favorite_add', 'favorite_remove', 'share_click')),
  visitor_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_agent text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_product_analytics_product_id ON product_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_event_type ON product_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_product_analytics_created_at ON product_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_product_analytics_visitor_id ON product_analytics(visitor_id);

-- Enable RLS
ALTER TABLE product_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert analytics events
CREATE POLICY "Anyone can insert analytics events"
  ON product_analytics
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Sellers can view analytics for their own products
CREATE POLICY "Sellers can view their product analytics"
  ON product_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN stores s ON p.store_id = s.id
      WHERE p.id = product_analytics.product_id
      AND s.seller_id = auth.uid()
    )
  );

-- Create function to get analytics summary for a seller
CREATE OR REPLACE FUNCTION get_seller_analytics_summary(
  seller_user_id uuid,
  start_date timestamptz DEFAULT now() - interval '30 days',
  end_date timestamptz DEFAULT now()
)
RETURNS TABLE (
  total_views bigint,
  total_buy_clicks bigint,
  total_chat_clicks bigint,
  total_whatsapp_clicks bigint,
  total_favorites bigint,
  total_shares bigint,
  unique_visitors bigint,
  conversion_rate numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE pa.event_type = 'view') as total_views,
    COUNT(*) FILTER (WHERE pa.event_type = 'buy_click') as total_buy_clicks,
    COUNT(*) FILTER (WHERE pa.event_type = 'chat_click') as total_chat_clicks,
    COUNT(*) FILTER (WHERE pa.event_type = 'whatsapp_click') as total_whatsapp_clicks,
    COUNT(*) FILTER (WHERE pa.event_type = 'favorite_add') as total_favorites,
    COUNT(*) FILTER (WHERE pa.event_type = 'share_click') as total_shares,
    COUNT(DISTINCT pa.visitor_id) as unique_visitors,
    CASE 
      WHEN COUNT(*) FILTER (WHERE pa.event_type = 'view') > 0 
      THEN ROUND((COUNT(*) FILTER (WHERE pa.event_type = 'buy_click')::numeric / COUNT(*) FILTER (WHERE pa.event_type = 'view')::numeric) * 100, 2)
      ELSE 0
    END as conversion_rate
  FROM product_analytics pa
  JOIN products p ON pa.product_id = p.id
  JOIN stores s ON p.store_id = s.id
  WHERE s.seller_id = seller_user_id
    AND pa.created_at >= start_date
    AND pa.created_at <= end_date;
END;
$$;