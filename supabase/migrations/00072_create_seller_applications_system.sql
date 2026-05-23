-- Create seller_applications table
CREATE TABLE IF NOT EXISTS seller_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_description TEXT,
  phone_number TEXT,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_seller_applications_user_id ON seller_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_applications_status ON seller_applications(status);
CREATE INDEX IF NOT EXISTS idx_seller_applications_created_at ON seller_applications(created_at DESC);

-- Enable RLS
ALTER TABLE seller_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own applications
CREATE POLICY "Users can view own applications"
  ON seller_applications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can create their own applications
CREATE POLICY "Users can create own applications"
  ON seller_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own pending applications
CREATE POLICY "Users can update own pending applications"
  ON seller_applications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Policy: Admins can view all applications
CREATE POLICY "Admins can view all applications"
  ON seller_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can update all applications
CREATE POLICY "Admins can update all applications"
  ON seller_applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to approve seller application
CREATE OR REPLACE FUNCTION approve_seller_application(
  p_application_id UUID,
  p_admin_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_business_name TEXT;
  v_location TEXT;
  v_store_id UUID;
  v_result JSONB;
BEGIN
  -- Get application details
  SELECT user_id, business_name, location
  INTO v_user_id, v_business_name, v_location
  FROM seller_applications
  WHERE id = p_application_id AND status = 'pending';

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application not found or already processed');
  END IF;

  -- Update user role to seller
  UPDATE profiles
  SET role = 'seller', updated_at = NOW()
  WHERE id = v_user_id;

  -- Create store for the new seller
  INSERT INTO stores (user_id, name, location, description)
  VALUES (
    v_user_id,
    v_business_name,
    v_location,
    'Welcome to my store!'
  )
  RETURNING id INTO v_store_id;

  -- Update application status
  UPDATE seller_applications
  SET 
    status = 'approved',
    reviewed_by = p_admin_id,
    reviewed_at = NOW(),
    admin_notes = p_admin_notes,
    updated_at = NOW()
  WHERE id = p_application_id;

  -- Create notification for user
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    v_user_id,
    'system',
    'Seller Application Approved',
    'Congratulations! Your seller application has been approved. You can now start selling on BESTOLD.',
    jsonb_build_object('store_id', v_store_id, 'link', '/seller/dashboard')
  );

  v_result := jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'store_id', v_store_id
  );

  RETURN v_result;
END;
$$;

-- Function to reject seller application
CREATE OR REPLACE FUNCTION reject_seller_application(
  p_application_id UUID,
  p_admin_id UUID,
  p_admin_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- Get application user_id
  SELECT user_id
  INTO v_user_id
  FROM seller_applications
  WHERE id = p_application_id AND status = 'pending';

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application not found or already processed');
  END IF;

  -- Update application status
  UPDATE seller_applications
  SET 
    status = 'rejected',
    reviewed_by = p_admin_id,
    reviewed_at = NOW(),
    admin_notes = p_admin_notes,
    updated_at = NOW()
  WHERE id = p_application_id;

  -- Create notification for user
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    v_user_id,
    'system',
    'Seller Application Update',
    'Your seller application has been reviewed. Please check your application status for more details.',
    jsonb_build_object('link', '/account')
  );

  v_result := jsonb_build_object('success', true, 'user_id', v_user_id);

  RETURN v_result;
END;
$$;