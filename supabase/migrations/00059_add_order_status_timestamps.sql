-- Add timestamp fields for order status transitions
ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- Create function to automatically update status timestamps
CREATE OR REPLACE FUNCTION update_order_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Set timestamp when status changes
  IF NEW.order_status = 'confirmed' AND OLD.order_status != 'confirmed' THEN
    NEW.confirmed_at = now();
  END IF;
  
  IF NEW.order_status = 'shipped' AND OLD.order_status != 'shipped' THEN
    NEW.shipped_at = now();
  END IF;
  
  IF NEW.order_status = 'delivered' AND OLD.order_status != 'delivered' THEN
    NEW.delivered_at = now();
  END IF;
  
  IF NEW.order_status = 'cancelled' AND OLD.order_status != 'cancelled' THEN
    NEW.cancelled_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
DROP TRIGGER IF EXISTS order_status_timestamp_trigger ON orders;
CREATE TRIGGER order_status_timestamp_trigger
  BEFORE UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.order_status IS DISTINCT FROM NEW.order_status)
  EXECUTE FUNCTION update_order_status_timestamp();

-- Backfill existing orders with estimated timestamps based on updated_at
UPDATE orders 
SET confirmed_at = updated_at 
WHERE order_status IN ('confirmed', 'shipped', 'delivered') 
  AND confirmed_at IS NULL;

UPDATE orders 
SET shipped_at = updated_at 
WHERE order_status IN ('shipped', 'delivered') 
  AND shipped_at IS NULL;

UPDATE orders 
SET delivered_at = updated_at 
WHERE order_status = 'delivered' 
  AND delivered_at IS NULL;

UPDATE orders 
SET cancelled_at = updated_at 
WHERE order_status = 'cancelled' 
  AND cancelled_at IS NULL;
