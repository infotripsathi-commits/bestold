-- Add analytics columns to notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES notification_templates(id);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS opened_at timestamptz;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS clicked_at timestamptz;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_notifications_template_id ON notifications(template_id);
CREATE INDEX IF NOT EXISTS idx_notifications_opened_at ON notifications(opened_at);
CREATE INDEX IF NOT EXISTS idx_notifications_clicked_at ON notifications(clicked_at);
CREATE INDEX IF NOT EXISTS idx_notifications_language ON notifications(language);

-- Function to track notification open
CREATE OR REPLACE FUNCTION track_notification_open(p_notification_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications
  SET opened_at = NOW()
  WHERE id = p_notification_id
  AND opened_at IS NULL;
  
  RETURN FOUND;
END;
$$;

-- Function to track notification click
CREATE OR REPLACE FUNCTION track_notification_click(p_notification_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications
  SET clicked_at = NOW(),
      opened_at = COALESCE(opened_at, NOW())
  WHERE id = p_notification_id
  AND clicked_at IS NULL;
  
  RETURN FOUND;
END;
$$;

-- Function to get template analytics
CREATE OR REPLACE FUNCTION get_template_analytics(
  p_start_date timestamptz DEFAULT NOW() - INTERVAL '30 days',
  p_end_date timestamptz DEFAULT NOW()
)
RETURNS TABLE (
  template_id uuid,
  template_type text,
  language text,
  title_template text,
  total_sent bigint,
  total_opened bigint,
  total_clicked bigint,
  open_rate numeric,
  click_rate numeric,
  click_through_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    nt.id as template_id,
    nt.type as template_type,
    nt.language,
    nt.title_template,
    COUNT(n.id) as total_sent,
    COUNT(n.opened_at) as total_opened,
    COUNT(n.clicked_at) as total_clicked,
    CASE 
      WHEN COUNT(n.id) > 0 THEN (COUNT(n.opened_at)::numeric / COUNT(n.id)::numeric * 100)
      ELSE 0
    END as open_rate,
    CASE 
      WHEN COUNT(n.id) > 0 THEN (COUNT(n.clicked_at)::numeric / COUNT(n.id)::numeric * 100)
      ELSE 0
    END as click_rate,
    CASE 
      WHEN COUNT(n.opened_at) > 0 THEN (COUNT(n.clicked_at)::numeric / COUNT(n.opened_at)::numeric * 100)
      ELSE 0
    END as click_through_rate
  FROM notification_templates nt
  LEFT JOIN notifications n ON n.template_id = nt.id
    AND n.created_at BETWEEN p_start_date AND p_end_date
  GROUP BY nt.id, nt.type, nt.language, nt.title_template
  ORDER BY total_sent DESC;
END;
$$;

-- Function to get language performance comparison
CREATE OR REPLACE FUNCTION get_language_performance(
  p_start_date timestamptz DEFAULT NOW() - INTERVAL '30 days',
  p_end_date timestamptz DEFAULT NOW()
)
RETURNS TABLE (
  language text,
  total_sent bigint,
  total_opened bigint,
  total_clicked bigint,
  open_rate numeric,
  click_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.language,
    COUNT(n.id) as total_sent,
    COUNT(n.opened_at) as total_opened,
    COUNT(n.clicked_at) as total_clicked,
    CASE 
      WHEN COUNT(n.id) > 0 THEN (COUNT(n.opened_at)::numeric / COUNT(n.id)::numeric * 100)
      ELSE 0
    END as open_rate,
    CASE 
      WHEN COUNT(n.id) > 0 THEN (COUNT(n.clicked_at)::numeric / COUNT(n.id)::numeric * 100)
      ELSE 0
    END as click_rate
  FROM notifications n
  WHERE n.created_at BETWEEN p_start_date AND p_end_date
  GROUP BY n.language
  ORDER BY total_sent DESC;
END;
$$;

-- Function to get engagement trends over time
CREATE OR REPLACE FUNCTION get_engagement_trends(
  p_start_date timestamptz DEFAULT NOW() - INTERVAL '30 days',
  p_end_date timestamptz DEFAULT NOW(),
  p_interval text DEFAULT 'day'
)
RETURNS TABLE (
  period text,
  total_sent bigint,
  total_opened bigint,
  total_clicked bigint,
  open_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(DATE_TRUNC(p_interval, n.created_at), 'YYYY-MM-DD') as period,
    COUNT(n.id) as total_sent,
    COUNT(n.opened_at) as total_opened,
    COUNT(n.clicked_at) as total_clicked,
    CASE 
      WHEN COUNT(n.id) > 0 THEN (COUNT(n.opened_at)::numeric / COUNT(n.id)::numeric * 100)
      ELSE 0
    END as open_rate
  FROM notifications n
  WHERE n.created_at BETWEEN p_start_date AND p_end_date
  GROUP BY DATE_TRUNC(p_interval, n.created_at)
  ORDER BY DATE_TRUNC(p_interval, n.created_at);
END;
$$;

-- Update create_admin_notification to store template_id
CREATE OR REPLACE FUNCTION create_admin_notification(
  p_type text,
  p_title text DEFAULT NULL,
  p_message text DEFAULT NULL,
  p_data jsonb DEFAULT '{}',
  p_language text DEFAULT 'en'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record record;
  inserted_count integer := 0;
  pref_enabled boolean;
  template_record record;
  rendered_title text;
  rendered_message text;
  template_variables jsonb;
BEGIN
  -- Try to get template
  SELECT * INTO template_record
  FROM notification_templates
  WHERE type = p_type
  AND language = p_language
  AND is_active = true
  LIMIT 1;
  
  -- If template found, render it with variables from p_data
  IF template_record IS NOT NULL THEN
    rendered_title := render_notification_template(template_record.title_template, p_data);
    rendered_message := render_notification_template(template_record.message_template, p_data);
  ELSE
    -- Fallback to provided title and message
    rendered_title := COALESCE(p_title, 'Notification');
    rendered_message := COALESCE(p_message, 'You have a new notification');
  END IF;
  
  -- Loop through all admins
  FOR admin_record IN 
    SELECT id FROM profiles WHERE role = 'admin'
  LOOP
    -- Check notification preferences
    SELECT 
      CASE p_type
        WHEN 'return_period_adjustment' THEN return_period_adjustment_enabled
        WHEN 'payout_request' THEN payout_request_enabled
        WHEN 'order_update' THEN order_update_enabled
        WHEN 'system' THEN system_enabled
        ELSE true
      END INTO pref_enabled
    FROM notification_preferences
    WHERE user_id = admin_record.id;
    
    -- If no preferences found, default to enabled
    IF pref_enabled IS NULL THEN
      pref_enabled := true;
    END IF;
    
    -- Create notification if enabled
    IF pref_enabled THEN
      INSERT INTO notifications (user_id, type, title, message, data, template_id, language)
      VALUES (
        admin_record.id, 
        p_type, 
        rendered_title, 
        rendered_message, 
        p_data,
        template_record.id,
        p_language
      );
      
      inserted_count := inserted_count + 1;
    END IF;
  END LOOP;
  
  RETURN inserted_count;
END;
$$;