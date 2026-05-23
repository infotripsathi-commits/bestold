-- Fix the function to get user_id from auth context instead of parameter
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
  -- Get user_id from auth context
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify the phone submission belongs to this user
  IF NOT EXISTS (
    SELECT 1 FROM phone_submissions 
    WHERE id = p_phone_submission_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Phone submission not found or access denied';
  END IF;

  -- Get the first admin user
  SELECT id INTO v_admin_id
  FROM profiles
  WHERE role = 'admin'
  ORDER BY created_at
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

  -- Create new conversation
  INSERT INTO conversations (buyer_id, seller_id, phone_submission_id, last_message_at)
  VALUES (v_user_id, v_admin_id, p_phone_submission_id, now())
  RETURNING id INTO v_conversation_id;

  -- Update phone submission status
  UPDATE phone_submissions
  SET status = 'in_discussion'
  WHERE id = p_phone_submission_id;

  RETURN v_conversation_id;
END;
$$;