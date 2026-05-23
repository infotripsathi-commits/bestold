-- Create notification_templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('return_period_adjustment', 'payout_request', 'order_update', 'system')),
  language text NOT NULL DEFAULT 'en',
  title_template text NOT NULL,
  message_template text NOT NULL,
  variables jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  UNIQUE(type, language)
);

-- Create notification_template_versions table
CREATE TABLE IF NOT EXISTS notification_template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES notification_templates(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  title_template text NOT NULL,
  message_template text NOT NULL,
  variables jsonb DEFAULT '[]',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(template_id, version_number)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_language ON notification_templates(language);
CREATE INDEX IF NOT EXISTS idx_notification_template_versions_template_id ON notification_template_versions(template_id);

-- Enable RLS
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_template_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_templates
CREATE POLICY "Admins can read notification templates"
  ON notification_templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert notification templates"
  ON notification_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update notification templates"
  ON notification_templates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS policies for notification_template_versions
CREATE POLICY "Admins can read template versions"
  ON notification_template_versions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default templates
INSERT INTO notification_templates (type, language, title_template, message_template, variables) VALUES
('return_period_adjustment', 'en', '{{count}} New Return Period Adjustments', '{{count}} new return period adjustment suggestions are ready for review. {{reduce_count}} reductions, {{increase_count}} increases.', '["count", "reduce_count", "increase_count"]'::jsonb),
('return_period_adjustment', 'es', '{{count}} Nuevos Ajustes de Período de Devolución', '{{count}} nuevas sugerencias de ajuste de período de devolución están listas para revisión. {{reduce_count}} reducciones, {{increase_count}} aumentos.', '["count", "reduce_count", "increase_count"]'::jsonb),
('payout_request', 'en', 'New Payout Request from {{seller_name}}', '{{seller_name}} has submitted a payout request for {{amount}}.', '["seller_name", "amount"]'::jsonb),
('payout_request', 'es', 'Nueva Solicitud de Pago de {{seller_name}}', '{{seller_name}} ha enviado una solicitud de pago por {{amount}}.', '["seller_name", "amount"]'::jsonb),
('order_update', 'en', 'Order #{{order_number}} Status Updated', 'Order #{{order_number}} status has been updated to {{status}}.', '["order_number", "status"]'::jsonb),
('order_update', 'es', 'Estado del Pedido #{{order_number}} Actualizado', 'El estado del pedido #{{order_number}} se ha actualizado a {{status}}.', '["order_number", "status"]'::jsonb),
('system', 'en', 'System Notification: {{title}}', '{{message}}', '["title", "message"]'::jsonb),
('system', 'es', 'Notificación del Sistema: {{title}}', '{{message}}', '["title", "message"]'::jsonb)
ON CONFLICT (type, language) DO NOTHING;

-- Function to render template with variables
CREATE OR REPLACE FUNCTION render_notification_template(
  p_template text,
  p_variables jsonb
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result text;
  var_key text;
  var_value text;
BEGIN
  result := p_template;
  
  -- Loop through variables and replace
  FOR var_key, var_value IN SELECT * FROM jsonb_each_text(p_variables)
  LOOP
    result := replace(result, '{{' || var_key || '}}', var_value);
  END LOOP;
  
  RETURN result;
END;
$$;

-- Function to create template version
CREATE OR REPLACE FUNCTION create_template_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_version integer;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
  FROM notification_template_versions
  WHERE template_id = NEW.id;
  
  -- Create version record
  INSERT INTO notification_template_versions (
    template_id,
    version_number,
    title_template,
    message_template,
    variables,
    created_by
  ) VALUES (
    NEW.id,
    next_version,
    NEW.title_template,
    NEW.message_template,
    NEW.variables,
    NEW.created_by
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for versioning
DROP TRIGGER IF EXISTS trigger_create_template_version ON notification_templates;
CREATE TRIGGER trigger_create_template_version
  AFTER INSERT OR UPDATE ON notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION create_template_version();

-- Update create_admin_notification to use templates
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
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (admin_record.id, p_type, rendered_title, rendered_message, p_data);
      
      inserted_count := inserted_count + 1;
    END IF;
  END LOOP;
  
  RETURN inserted_count;
END;
$$;