
-- 1. push_subscriptions table
CREATE TABLE push_subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    text NOT NULL,
  p256dh      text NOT NULL,
  auth_key    text NOT NULL,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own push subscriptions"
  ON push_subscriptions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "service role full access push_subscriptions"
  ON push_subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Add push_notifications column to notification_preferences
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS push_new_messages   boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_order_updates  boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_enabled        boolean NOT NULL DEFAULT false;

-- 3. Helper: fetch push subscriptions for a user (service-definer, callable from triggers)
CREATE OR REPLACE FUNCTION get_push_subscriptions_for_user(p_user_id uuid)
RETURNS TABLE(endpoint text, p256dh text, auth_key text)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT endpoint, p256dh, auth_key
  FROM push_subscriptions
  WHERE user_id = p_user_id;
$$;
