-- Add read tracking to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster unread queries
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(conversation_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_messages_sender_read ON messages(sender_id, read);

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id uuid)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Count messages in conversations where user is participant but not sender
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM messages m
  INNER JOIN conversations c ON m.conversation_id = c.id
  WHERE m.read = FALSE
    AND m.sender_id != p_user_id
    AND (
      c.buyer_id = p_user_id OR 
      c.seller_id = p_user_id OR
      (c.phone_submission_id IS NOT NULL AND c.phone_submission_id IN (
        SELECT id FROM phone_submissions WHERE user_id = p_user_id
      )) OR
      (EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND role = 'admin'))
    );
  
  RETURN v_count;
END;
$$;

-- Function to mark conversation messages as read
CREATE OR REPLACE FUNCTION mark_conversation_as_read(p_conversation_id uuid, p_user_id uuid)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark all messages in this conversation as read (except user's own messages)
  UPDATE messages
  SET read = TRUE, read_at = now()
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND read = FALSE;
END;
$$;

-- Function to get unread count per conversation for a user
CREATE OR REPLACE FUNCTION get_unread_by_conversation(p_user_id uuid)
RETURNS TABLE(conversation_id uuid, unread_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.conversation_id,
    COUNT(*)::bigint as unread_count
  FROM messages m
  INNER JOIN conversations c ON m.conversation_id = c.id
  WHERE m.read = FALSE
    AND m.sender_id != p_user_id
    AND (
      c.buyer_id = p_user_id OR 
      c.seller_id = p_user_id OR
      (c.phone_submission_id IS NOT NULL AND c.phone_submission_id IN (
        SELECT id FROM phone_submissions WHERE user_id = p_user_id
      )) OR
      (EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND role = 'admin'))
    )
  GROUP BY m.conversation_id;
END;
$$;