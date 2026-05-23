
-- 1. Change the column default so any future store INSERT without explicit value defaults to false
ALTER TABLE stores ALTER COLUMN store_pickup_enabled SET DEFAULT false;

-- 2. Update all existing stores that were created via approval (approval_status='approved')
--    and have never been manually toggled ON by admin to be OFF.
--    We only reset stores where pickup is ON but no admin ever consciously turned it on —
--    i.e. all approved stores (safe since admin can re-enable individually).
-- NOTE: Per user requirement, new stores should start OFF; existing ON stores
--       have already been reviewed and set by admin so we leave them as-is.
-- No UPDATE needed for existing stores — the user only wants NEW stores to start OFF.

-- 3. Replace the approve_seller_application function to explicitly set store_pickup_enabled = false
CREATE OR REPLACE FUNCTION approve_seller_application(
  p_application_id uuid,
  p_admin_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
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
  -- Get application details
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

  -- Create store — pickup OFF by default; admin must enable it explicitly
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
    approval_status,
    store_pickup_enabled
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
    'approved',
    false   -- pickup starts OFF; admin enables when ready
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

  -- Notify the seller
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
