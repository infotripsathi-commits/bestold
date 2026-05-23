
-- Function to allow sellers to update their rejected application and resubmit for review
CREATE OR REPLACE FUNCTION resubmit_seller_application(
  p_application_id uuid,
  p_user_id uuid,
  p_business_name text,
  p_business_description text DEFAULT NULL,
  p_phone_number text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_banner_image_url text DEFAULT NULL,
  p_shop_images text[] DEFAULT '{}',
  p_trade_license_url text DEFAULT NULL,
  p_latitude double precision DEFAULT NULL,
  p_longitude double precision DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow resubmission of rejected applications by the owner
  UPDATE seller_applications
  SET
    business_name = p_business_name,
    business_description = p_business_description,
    phone_number = p_phone_number,
    location = p_location,
    banner_image_url = p_banner_image_url,
    shop_images = p_shop_images,
    trade_license_url = p_trade_license_url,
    latitude = p_latitude,
    longitude = p_longitude,
    status = 'pending',
    admin_notes = NULL,
    reviewed_by = NULL,
    reviewed_at = NULL,
    updated_at = now()
  WHERE id = p_application_id
    AND user_id = p_user_id
    AND status = 'rejected';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found or cannot be resubmitted';
  END IF;
END;
$$;
