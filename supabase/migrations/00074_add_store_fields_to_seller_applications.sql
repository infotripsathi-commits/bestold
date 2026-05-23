-- Add store-related fields to seller_applications table
-- These fields will be transferred to the store upon approval

ALTER TABLE seller_applications
ADD COLUMN IF NOT EXISTS banner_image_url TEXT,
ADD COLUMN IF NOT EXISTS shop_images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS trade_license_url TEXT,
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8);

-- Add comments for documentation
COMMENT ON COLUMN seller_applications.banner_image_url IS 'URL of the store banner image';
COMMENT ON COLUMN seller_applications.shop_images IS 'Array of shop image URLs (max 5 images)';
COMMENT ON COLUMN seller_applications.trade_license_url IS 'URL of trade license document for verification';
COMMENT ON COLUMN seller_applications.latitude IS 'GPS latitude coordinate of the store';
COMMENT ON COLUMN seller_applications.longitude IS 'GPS longitude coordinate of the store';

-- Update the approve_seller_application function to transfer these fields
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
  v_business_description TEXT;
  v_location TEXT;
  v_phone_number TEXT;
  v_banner_image_url TEXT;
  v_shop_images TEXT[];
  v_trade_license_url TEXT;
  v_latitude NUMERIC;
  v_longitude NUMERIC;
  v_store_id UUID;
  v_result JSONB;
BEGIN
  -- Get application details including new fields
  SELECT 
    user_id, 
    business_name, 
    business_description,
    location,
    phone_number,
    banner_image_url,
    shop_images,
    trade_license_url,
    latitude,
    longitude
  INTO 
    v_user_id, 
    v_business_name, 
    v_business_description,
    v_location,
    v_phone_number,
    v_banner_image_url,
    v_shop_images,
    v_trade_license_url,
    v_latitude,
    v_longitude
  FROM seller_applications
  WHERE id = p_application_id AND status = 'pending';

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application not found or already processed');
  END IF;

  -- Update user role to seller
  UPDATE profiles
  SET role = 'seller', updated_at = NOW()
  WHERE id = v_user_id;

  -- Create store for the new seller with all fields
  INSERT INTO stores (
    seller_id, 
    name, 
    description,
    location,
    phone_number,
    banner_image_url,
    shop_images,
    trade_license_url,
    latitude,
    longitude,
    approval_status
  )
  VALUES (
    v_user_id,
    v_business_name,
    COALESCE(v_business_description, 'Welcome to my store!'),
    v_location,
    v_phone_number,
    v_banner_image_url,
    v_shop_images,
    v_trade_license_url,
    v_latitude,
    v_longitude,
    'approved'
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