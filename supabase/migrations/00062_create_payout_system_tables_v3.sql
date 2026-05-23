-- Create payout_requests table
CREATE TABLE IF NOT EXISTS payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  amount numeric(10, 2) NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  payment_method text NOT NULL CHECK (payment_method IN ('bank_transfer', 'upi', 'paypal', 'other')),
  bank_name text,
  account_number text,
  ifsc_code text,
  upi_id text,
  account_holder_name text,
  notes text,
  admin_notes text,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  rejected_reason text,
  transaction_id text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create payout_transactions table for completed payouts
CREATE TABLE IF NOT EXISTS payout_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_request_id uuid NOT NULL REFERENCES payout_requests(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(10, 2) NOT NULL,
  payment_method text NOT NULL,
  transaction_id text NOT NULL,
  transaction_date timestamptz NOT NULL DEFAULT now(),
  processed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payout_requests_seller_id ON payout_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_payout_requests_created_at ON payout_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_payout_transactions_seller_id ON payout_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_payout_transactions_payout_request_id ON payout_transactions(payout_request_id);

-- Enable RLS
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payout_requests
CREATE POLICY "Sellers can view their own payout requests"
  ON payout_requests
  FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can create payout requests"
  ON payout_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can update their pending requests"
  ON payout_requests
  FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid() AND status = 'pending')
  WITH CHECK (seller_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can view all payout requests"
  ON payout_requests
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update payout requests"
  ON payout_requests
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

-- RLS Policies for payout_transactions
CREATE POLICY "Sellers can view their own transactions"
  ON payout_transactions
  FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "Admins can view all transactions"
  ON payout_transactions
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can create transactions"
  ON payout_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- Function to calculate seller available balance
CREATE OR REPLACE FUNCTION get_seller_available_balance(seller_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_earnings numeric;
  total_payouts numeric;
  available_balance numeric;
BEGIN
  -- Calculate total earnings from delivered orders
  SELECT COALESCE(SUM(total_amount), 0)
  INTO total_earnings
  FROM orders
  WHERE seller_id = seller_user_id
  AND order_status = 'delivered';

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

-- Function to get seller payout summary
CREATE OR REPLACE FUNCTION get_seller_payout_summary(seller_user_id uuid)
RETURNS TABLE (
  total_earnings numeric,
  total_payouts numeric,
  pending_payouts numeric,
  available_balance numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(o.total_amount) FILTER (WHERE o.order_status = 'delivered'), 0) as total_earnings,
    COALESCE(SUM(pr.amount) FILTER (WHERE pr.status = 'completed'), 0) as total_payouts,
    COALESCE(SUM(pr.amount) FILTER (WHERE pr.status IN ('pending', 'approved')), 0) as pending_payouts,
    COALESCE(SUM(o.total_amount) FILTER (WHERE o.order_status = 'delivered'), 0) - 
    COALESCE(SUM(pr.amount) FILTER (WHERE pr.status = 'completed'), 0) as available_balance
  FROM orders o
  LEFT JOIN payout_requests pr ON pr.seller_id = seller_user_id
  WHERE o.seller_id = seller_user_id;
END;
$$;