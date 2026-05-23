-- Drop and recreate functions with new signatures
DROP FUNCTION IF EXISTS get_seller_payout_summary(uuid);
DROP FUNCTION IF EXISTS get_seller_available_balance(uuid);

-- Update get_seller_available_balance to enforce return policy
CREATE FUNCTION get_seller_available_balance(seller_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_earnings numeric;
  total_payouts numeric;
  available_balance numeric;
BEGIN
  -- Calculate total earnings from delivered orders PAST return period
  SELECT COALESCE(SUM(total_amount), 0)
  INTO total_earnings
  FROM orders
  WHERE seller_id = seller_user_id
  AND order_status = 'delivered'
  AND (return_period_ends_at IS NULL OR return_period_ends_at < NOW())
  AND (payout_status IS NULL OR payout_status != 'completed');

  -- Calculate total completed payouts
  SELECT COALESCE(SUM(amount), 0)
  INTO total_payouts
  FROM payout_requests
  WHERE seller_id = seller_user_id
  AND status = 'completed';

  available_balance := total_earnings - total_payouts;

  RETURN GREATEST(available_balance, 0);
END;
$$;

-- Create new get_seller_payout_summary with locked_balance
CREATE FUNCTION get_seller_payout_summary(seller_user_id uuid)
RETURNS TABLE (
  total_earnings numeric,
  total_payouts numeric,
  pending_payouts numeric,
  available_balance numeric,
  locked_balance numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Total from all delivered orders
    COALESCE(SUM(o.total_amount) FILTER (WHERE o.order_status = 'delivered'), 0) as total_earnings,
    -- Total completed payouts
    COALESCE(SUM(pr.amount) FILTER (WHERE pr.status = 'completed'), 0) as total_payouts,
    -- Pending payout requests
    COALESCE(SUM(pr.amount) FILTER (WHERE pr.status IN ('pending', 'approved')), 0) as pending_payouts,
    -- Available: delivered + past return period - completed payouts
    COALESCE(
      SUM(o.total_amount) FILTER (
        WHERE o.order_status = 'delivered' 
        AND (o.return_period_ends_at IS NULL OR o.return_period_ends_at < NOW())
        AND (o.payout_status IS NULL OR o.payout_status != 'completed')
      ), 0
    ) - COALESCE(SUM(pr.amount) FILTER (WHERE pr.status = 'completed'), 0) as available_balance,
    -- Locked: delivered but still in return period
    COALESCE(
      SUM(o.total_amount) FILTER (
        WHERE o.order_status = 'delivered' 
        AND o.return_period_ends_at IS NOT NULL 
        AND o.return_period_ends_at >= NOW()
      ), 0
    ) as locked_balance
  FROM orders o
  LEFT JOIN payout_requests pr ON pr.seller_id = seller_user_id
  WHERE o.seller_id = seller_user_id;
END;
$$;

-- Function to get seller orders with payout eligibility
CREATE OR REPLACE FUNCTION get_seller_orders_with_payout_status(seller_user_id uuid)
RETURNS TABLE (
  order_id uuid,
  order_number text,
  total_amount numeric,
  order_status text,
  delivered_at timestamptz,
  return_period_ends_at timestamptz,
  payout_status text,
  is_eligible_for_payout boolean,
  days_until_eligible integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id as order_id,
    o.order_number,
    o.total_amount,
    o.order_status,
    o.updated_at as delivered_at,
    o.return_period_ends_at,
    o.payout_status,
    CASE 
      WHEN o.order_status = 'delivered' 
        AND (o.return_period_ends_at IS NULL OR o.return_period_ends_at < NOW())
        AND (o.payout_status IS NULL OR o.payout_status != 'completed')
      THEN true
      ELSE false
    END as is_eligible_for_payout,
    CASE
      WHEN o.return_period_ends_at IS NOT NULL AND o.return_period_ends_at >= NOW()
      THEN EXTRACT(DAY FROM o.return_period_ends_at - NOW())::integer
      ELSE 0
    END as days_until_eligible
  FROM orders o
  WHERE o.seller_id = seller_user_id
  AND o.order_status = 'delivered'
  ORDER BY o.return_period_ends_at ASC NULLS FIRST;
END;
$$;

-- Trigger function to set return period when order is delivered
CREATE OR REPLACE FUNCTION set_return_period_on_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If order status changed to 'delivered' and return_period_ends_at is not set
  IF NEW.order_status = 'delivered' 
     AND OLD.order_status != 'delivered' 
     AND NEW.return_period_ends_at IS NULL THEN
    -- Set return period to 7 days from now (configurable)
    NEW.return_period_ends_at := NOW() + INTERVAL '7 days';
    NEW.payout_status := 'locked';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS trigger_set_return_period ON orders;
CREATE TRIGGER trigger_set_return_period
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_return_period_on_delivery();

-- Function to mark orders as eligible for payout (run periodically or on-demand)
CREATE OR REPLACE FUNCTION update_payout_eligibility()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Update orders where return period has expired
  UPDATE orders
  SET payout_status = 'eligible'
  WHERE order_status = 'delivered'
  AND return_period_ends_at IS NOT NULL
  AND return_period_ends_at < NOW()
  AND (payout_status IS NULL OR payout_status = 'locked');
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;