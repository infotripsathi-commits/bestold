
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
  p_latitude numeric DEFAULT NULL,
  p_longitude numeric DEFAULT NULL,
  p_business_type text DEFAULT 'retail',
  p_youtube_url text DEFAULT NULL,
  p_facebook_url text DEFAULT NULL,
  p_instagram_url text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
    business_type = p_business_type,
    youtube_url = p_youtube_url,
    facebook_url = p_facebook_url,
    instagram_url = p_instagram_url,
    status = 'pending',
    admin_notes = NULL,
    reviewed_by = NULL,
    reviewed_at = NULL,
    updated_at = NOW()
  WHERE id = p_application_id AND user_id = p_user_id;
END;
$$;
