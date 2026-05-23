-- Create function to automatically set return period when order is delivered
CREATE OR REPLACE FUNCTION set_return_period_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  -- If order status changed to 'delivered' and return_period_ends_at is not set
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' AND NEW.return_period_ends_at IS NULL THEN
    -- Set return period to 7 days from now
    NEW.return_period_ends_at = NOW() + INTERVAL '7 days';
    -- Set payout status to pending if not already set
    IF NEW.payout_status IS NULL THEN
      NEW.payout_status = 'pending';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for return period
DROP TRIGGER IF EXISTS trigger_set_return_period ON orders;
CREATE TRIGGER trigger_set_return_period
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_return_period_on_delivery();

-- Create function to automatically update payout eligibility
CREATE OR REPLACE FUNCTION update_payout_eligibility()
RETURNS void AS $$
DECLARE
  eligible_order RECORD;
BEGIN
  -- Update orders where return period has expired and payout is still pending
  FOR eligible_order IN
    SELECT 
      o.id,
      o.order_number,
      o.total_amount,
      o.return_period_ends_at,
      p.title as product_title,
      s.name as store_name,
      pr.email as seller_email,
      pr.full_name as seller_name
    FROM orders o
    JOIN products p ON o.product_id = p.id
    JOIN stores s ON o.store_id = s.id
    JOIN profiles pr ON s.seller_id = pr.id
    WHERE o.order_status = 'delivered'
      AND o.payout_status = 'pending'
      AND o.return_period_ends_at IS NOT NULL
      AND o.return_period_ends_at < NOW()
  LOOP
    -- Update payout status
    UPDATE orders
    SET payout_status = 'eligible'
    WHERE id = eligible_order.id;
    
    -- Note: Email notification would be sent via Edge Function trigger
    -- The application will call the Edge Function when this status changes
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a function that can be called periodically (or manually) to check eligibility
COMMENT ON FUNCTION update_payout_eligibility() IS 'Updates payout status to eligible for orders past return period';
