
-- Add store pickup / advance payment columns to orders table
ALTER TABLE orders
  ADD COLUMN order_type text NOT NULL DEFAULT 'delivery' CHECK (order_type IN ('delivery', 'store_pickup')),
  ADD COLUMN advance_amount numeric(10,2),
  ADD COLUMN advance_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN advance_payment_reference text,
  ADD COLUMN pickup_deadline timestamptz,
  ADD COLUMN pickup_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN advance_non_refundable boolean NOT NULL DEFAULT false;

-- Index for querying pickup orders by seller
CREATE INDEX idx_orders_order_type ON orders(order_type);
CREATE INDEX idx_orders_pickup_deadline ON orders(pickup_deadline) WHERE order_type = 'store_pickup';
