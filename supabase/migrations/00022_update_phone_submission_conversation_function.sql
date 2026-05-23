-- Update the function to handle nullable seller_id
CREATE OR REPLACE FUNCTION create_phone_submission_conversation(p_phone_submission_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id uuid;
  v_user_id uuid;
  v_admin_id uuid;
BEGIN
  -- Get the user_id from the phone submission
  SELECT user_id INTO v_user_id
  FROM phone_submissions
  WHERE id = p_phone_submission_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Phone submission not found';
  END IF;

  -- Get the first admin user
  SELECT id INTO v_admin_id
  FROM profiles
  WHERE role = 'admin'
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'No admin user found';
  END IF;

  -- Check if conversation already exists
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE phone_submission_id = p_phone_submission_id;

  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  -- Create new conversation with nullable seller_id
  INSERT INTO conversations (buyer_id, seller_id, phone_submission_id)
  VALUES (v_user_id, v_admin_id, p_phone_submission_id)
  RETURNING id INTO v_conversation_id;

  -- Update phone submission status
  UPDATE phone_submissions
  SET status = 'in_discussion'
  WHERE id = p_phone_submission_id;

  RETURN v_conversation_id;
END;
$$;