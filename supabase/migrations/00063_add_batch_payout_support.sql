-- Create batch_payouts table
CREATE TABLE IF NOT EXISTS batch_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_type text NOT NULL CHECK (batch_type IN ('approval', 'payment')),
  total_amount numeric(10, 2) NOT NULL,
  request_count integer NOT NULL,
  processed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add batch_id to payout_requests
ALTER TABLE payout_requests ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES batch_payouts(id) ON DELETE SET NULL;

-- Add batch_id to payout_transactions
ALTER TABLE payout_transactions ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES batch_payouts(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_batch_payouts_processed_by ON batch_payouts(processed_by);
CREATE INDEX IF NOT EXISTS idx_batch_payouts_created_at ON batch_payouts(created_at);
CREATE INDEX IF NOT EXISTS idx_payout_requests_batch_id ON payout_requests(batch_id);
CREATE INDEX IF NOT EXISTS idx_payout_transactions_batch_id ON payout_transactions(batch_id);

-- Enable RLS
ALTER TABLE batch_payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for batch_payouts
CREATE POLICY "Admins can view all batch payouts"
  ON batch_payouts
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can create batch payouts"
  ON batch_payouts
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- Function to batch approve payout requests
CREATE OR REPLACE FUNCTION batch_approve_payout_requests(
  request_ids uuid[],
  admin_user_id uuid,
  notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  batch_uuid uuid;
  total_amt numeric;
  req_count integer;
BEGIN
  -- Calculate total amount and count
  SELECT 
    COALESCE(SUM(amount), 0),
    COUNT(*)
  INTO total_amt, req_count
  FROM payout_requests
  WHERE id = ANY(request_ids)
  AND status = 'pending';

  -- Create batch record
  INSERT INTO batch_payouts (batch_type, total_amount, request_count, processed_by, admin_notes)
  VALUES ('approval', total_amt, req_count, admin_user_id, notes)
  RETURNING id INTO batch_uuid;

  -- Update payout requests
  UPDATE payout_requests
  SET 
    status = 'approved',
    approved_by = admin_user_id,
    approved_at = now(),
    admin_notes = COALESCE(notes, admin_notes),
    batch_id = batch_uuid,
    updated_at = now()
  WHERE id = ANY(request_ids)
  AND status = 'pending';

  RETURN batch_uuid;
END;
$$;

-- Function to batch complete payout requests
CREATE OR REPLACE FUNCTION batch_complete_payout_requests(
  request_ids uuid[],
  admin_user_id uuid,
  transaction_prefix text,
  notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  batch_uuid uuid;
  total_amt numeric;
  req_count integer;
  req record;
  txn_id text;
BEGIN
  -- Calculate total amount and count
  SELECT 
    COALESCE(SUM(amount), 0),
    COUNT(*)
  INTO total_amt, req_count
  FROM payout_requests
  WHERE id = ANY(request_ids)
  AND status = 'approved';

  -- Create batch record
  INSERT INTO batch_payouts (batch_type, total_amount, request_count, processed_by, admin_notes)
  VALUES ('payment', total_amt, req_count, admin_user_id, notes)
  RETURNING id INTO batch_uuid;

  -- Process each request
  FOR req IN 
    SELECT * FROM payout_requests 
    WHERE id = ANY(request_ids) 
    AND status = 'approved'
  LOOP
    -- Generate transaction ID
    txn_id := transaction_prefix || '_' || SUBSTRING(req.id::text, 1, 8);

    -- Update payout request
    UPDATE payout_requests
    SET 
      status = 'completed',
      transaction_id = txn_id,
      paid_at = now(),
      batch_id = batch_uuid,
      updated_at = now()
    WHERE id = req.id;

    -- Create transaction record
    INSERT INTO payout_transactions (
      payout_request_id,
      seller_id,
      amount,
      payment_method,
      transaction_id,
      processed_by,
      notes,
      batch_id
    ) VALUES (
      req.id,
      req.seller_id,
      req.amount,
      req.payment_method,
      txn_id,
      admin_user_id,
      notes,
      batch_uuid
    );
  END LOOP;

  RETURN batch_uuid;
END;
$$;