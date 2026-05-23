
-- ── Trigger: new order placed → notify seller ────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_push_on_new_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_product_title text;
  v_buyer_name    text;
  v_order_ref     text;
BEGIN
  -- Get product title
  SELECT title INTO v_product_title
  FROM products WHERE id = NEW.product_id;

  -- Get buyer display name
  SELECT COALESCE(full_name, 'A buyer') INTO v_buyer_name
  FROM profiles WHERE id = NEW.buyer_id;

  v_order_ref := COALESCE(NEW.order_number, left(NEW.id::text, 8));

  PERFORM notify_push(
    NEW.seller_id,
    'New Order Received 🛒',
    v_buyer_name || ' ordered ' ||
      COALESCE(v_product_title, 'your product') ||
      ' — Order #' || v_order_ref,
    '/seller/orders',
    'new-order-' || NEW.id::text
  );

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'push_on_new_order'
  ) THEN
    CREATE TRIGGER push_on_new_order
      AFTER INSERT ON orders
      FOR EACH ROW
      WHEN (NEW.seller_id IS NOT NULL)
      EXECUTE FUNCTION trigger_push_on_new_order();
  END IF;
END;
$$;

-- ── Trigger: return requested → notify seller ────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_push_on_return_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_product_title text;
  v_buyer_name    text;
  v_order_ref     text;
BEGIN
  -- Only fire when return_requested changes false → true
  IF OLD.return_requested IS NOT DISTINCT FROM NEW.return_requested THEN RETURN NEW; END IF;
  IF NEW.return_requested IS NOT TRUE THEN RETURN NEW; END IF;

  SELECT title INTO v_product_title
  FROM products WHERE id = NEW.product_id;

  SELECT COALESCE(full_name, 'A buyer') INTO v_buyer_name
  FROM profiles WHERE id = NEW.buyer_id;

  v_order_ref := COALESCE(NEW.order_number, left(NEW.id::text, 8));

  PERFORM notify_push(
    NEW.seller_id,
    'Return Requested ↩️',
    v_buyer_name || ' requested a return for ' ||
      COALESCE(v_product_title, 'an item') ||
      ' (Order #' || v_order_ref || ')',
    '/seller/orders',
    'return-' || NEW.id::text
  );

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'push_on_return_request'
  ) THEN
    CREATE TRIGGER push_on_return_request
      AFTER UPDATE OF return_requested ON orders
      FOR EACH ROW
      EXECUTE FUNCTION trigger_push_on_return_request();
  END IF;
END;
$$;

-- ── Extend existing order_status trigger to also notify seller ───────────────
-- Replace the existing trigger function to handle both buyer AND seller
CREATE OR REPLACE FUNCTION trigger_push_on_order_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_buyer_label   text;
  v_seller_label  text;
  v_order_ref     text;
  v_product_title text;
BEGIN
  IF OLD.order_status IS NOT DISTINCT FROM NEW.order_status THEN RETURN NEW; END IF;

  v_order_ref := COALESCE(NEW.order_number, left(NEW.id::text, 8));

  -- Labels for buyer
  v_buyer_label := CASE NEW.order_status
    WHEN 'confirmed'  THEN 'Order Confirmed ✅'
    WHEN 'shipped'    THEN 'Order Shipped 📦'
    WHEN 'delivered'  THEN 'Order Delivered 🎉'
    WHEN 'cancelled'  THEN 'Order Cancelled ❌'
    WHEN 'refunded'   THEN 'Refund Processed 💰'
    ELSE NULL
  END;

  -- Labels for seller
  v_seller_label := CASE NEW.order_status
    WHEN 'cancelled'  THEN 'Order Cancelled by Buyer ❌'
    ELSE NULL
  END;

  -- Notify buyer
  IF v_buyer_label IS NOT NULL AND NEW.buyer_id IS NOT NULL THEN
    PERFORM notify_push(
      NEW.buyer_id,
      v_buyer_label,
      'Your order #' || v_order_ref || ' status updated',
      '/orders',
      'order-' || NEW.id::text
    );
  END IF;

  -- Notify seller (only for cancellations — new orders & returns have own triggers)
  IF v_seller_label IS NOT NULL AND NEW.seller_id IS NOT NULL THEN
    SELECT title INTO v_product_title FROM products WHERE id = NEW.product_id;
    PERFORM notify_push(
      NEW.seller_id,
      v_seller_label,
      'Order #' || v_order_ref ||
        CASE WHEN v_product_title IS NOT NULL
             THEN ' for ' || v_product_title || ' was cancelled'
             ELSE ' was cancelled by the buyer'
        END,
      '/seller/orders',
      'order-cancel-' || NEW.id::text
    );
  END IF;

  RETURN NEW;
END;
$$;
