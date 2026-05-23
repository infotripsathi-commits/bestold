
-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- ── Helper: call push notification edge function for a user ──────────────────
CREATE OR REPLACE FUNCTION notify_push(
  p_user_id   uuid,
  p_title     text,
  p_body      text,
  p_url       text DEFAULT '/',
  p_tag       text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_service_role_key text;
  v_supabase_url     text;
BEGIN
  SELECT current_setting('app.settings.service_role_key', true) INTO v_service_role_key;
  SELECT current_setting('app.settings.supabase_url', true)     INTO v_supabase_url;

  -- Fallback to built-in secrets
  IF v_supabase_url IS NULL THEN
    v_supabase_url := current_setting('supabase.functions.url', true);
  END IF;
  IF v_service_role_key IS NULL THEN
    v_service_role_key := current_setting('supabase.service_role_key', true);
  END IF;

  IF v_supabase_url IS NULL OR v_service_role_key IS NULL THEN
    RETURN;
  END IF;

  PERFORM extensions.http_post(
    url     => v_supabase_url || '/functions/v1/send-push-notification',
    headers => jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_service_role_key
    )::text,
    body    => jsonb_build_object(
      'user_id', p_user_id,
      'title',   p_title,
      'body',    p_body,
      'url',     p_url,
      'tag',     p_tag
    )::text
  );
EXCEPTION WHEN OTHERS THEN
  NULL; -- Never let push failure break a transaction
END;
$$;

-- ── Trigger function: new chat message ───────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_push_on_new_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_recipient_id   uuid;
  v_sender_name    text;
  v_conv           record;
BEGIN
  SELECT buyer_id, seller_id INTO v_conv
  FROM conversations WHERE id = NEW.conversation_id;

  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Recipient is the other party
  IF NEW.sender_id = v_conv.buyer_id THEN
    v_recipient_id := v_conv.seller_id;
  ELSE
    v_recipient_id := v_conv.buyer_id;
  END IF;

  SELECT COALESCE(full_name, username, 'Someone') INTO v_sender_name
  FROM profiles WHERE id = NEW.sender_id;

  PERFORM notify_push(
    v_recipient_id,
    'New message from ' || COALESCE(v_sender_name, 'Someone'),
    CASE WHEN length(COALESCE(NEW.content, '')) > 80
         THEN left(NEW.content, 77) || '...'
         ELSE COALESCE(NEW.content, 'Sent a message')
    END,
    '/chat',
    'chat-' || NEW.conversation_id::text
  );
  RETURN NEW;
END;
$$;

-- Create trigger only if messages table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'messages'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'push_on_new_message'
  ) THEN
    CREATE TRIGGER push_on_new_message
      AFTER INSERT ON messages
      FOR EACH ROW
      WHEN (NEW.sender_id IS NOT NULL)
      EXECUTE FUNCTION trigger_push_on_new_message();
  END IF;
END;
$$;

-- ── Trigger function: order status change ────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_push_on_order_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_label      text;
  v_order_ref  text;
BEGIN
  IF OLD.order_status IS NOT DISTINCT FROM NEW.order_status THEN RETURN NEW; END IF;

  v_label := CASE NEW.order_status
    WHEN 'confirmed'  THEN 'Order Confirmed ✅'
    WHEN 'shipped'    THEN 'Order Shipped 📦'
    WHEN 'delivered'  THEN 'Order Delivered 🎉'
    WHEN 'cancelled'  THEN 'Order Cancelled ❌'
    WHEN 'refunded'   THEN 'Refund Processed 💰'
    ELSE NULL
  END;

  IF v_label IS NULL THEN RETURN NEW; END IF;

  v_order_ref := COALESCE(NEW.order_number, left(NEW.id::text, 8));

  -- Notify buyer
  IF NEW.buyer_id IS NOT NULL THEN
    PERFORM notify_push(
      NEW.buyer_id,
      v_label,
      'Your order #' || v_order_ref || ' status updated',
      '/orders',
      'order-' || NEW.id::text
    );
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'push_on_order_status'
  ) THEN
    CREATE TRIGGER push_on_order_status
      AFTER UPDATE OF order_status ON orders
      FOR EACH ROW
      EXECUTE FUNCTION trigger_push_on_order_status();
  END IF;
END;
$$;
