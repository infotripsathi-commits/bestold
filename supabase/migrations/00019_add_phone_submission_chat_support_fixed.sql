-- Add phone_submission_id to conversations table
ALTER TABLE conversations 
  ADD COLUMN IF NOT EXISTS phone_submission_id uuid REFERENCES phone_submissions(id) ON DELETE CASCADE;

-- Add status to phone_submissions
ALTER TABLE phone_submissions 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS chat_closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS chat_closed_by uuid REFERENCES profiles(id);

-- Create index for phone submission conversations
CREATE INDEX IF NOT EXISTS idx_conversations_phone_submission ON conversations(phone_submission_id);

-- Add check constraint for status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'phone_submissions_status_check'
  ) THEN
    ALTER TABLE phone_submissions 
    ADD CONSTRAINT phone_submissions_status_check 
    CHECK (status IN ('pending', 'in_discussion', 'quoted', 'accepted', 'rejected', 'closed'));
  END IF;
END $$;

-- Update RLS policies for conversations to include phone submissions
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (
    buyer_id = auth.uid() 
    OR seller_id = auth.uid()
    OR (phone_submission_id IS NOT NULL AND phone_submission_id IN (
      SELECT id FROM phone_submissions WHERE user_id = auth.uid()
    ))
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Allow creating conversations for phone submissions
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    (buyer_id = auth.uid() AND store_id IS NOT NULL)
    OR (phone_submission_id IS NOT NULL)
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Update messages RLS to include phone submission conversations
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE buyer_id = auth.uid() 
        OR seller_id = auth.uid()
        OR (phone_submission_id IS NOT NULL AND phone_submission_id IN (
          SELECT id FROM phone_submissions WHERE user_id = auth.uid()
        ))
        OR EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
    )
  );

-- Allow sending messages in phone submission conversations
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE buyer_id = auth.uid() 
        OR seller_id = auth.uid()
        OR (phone_submission_id IS NOT NULL AND phone_submission_id IN (
          SELECT id FROM phone_submissions WHERE user_id = auth.uid()
        ))
        OR EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
    )
  );

-- Create function to create phone submission conversation
CREATE OR REPLACE FUNCTION create_phone_submission_conversation(
  p_phone_submission_id uuid,
  p_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id uuid;
  v_admin_id uuid;
BEGIN
  -- Get first admin user
  SELECT id INTO v_admin_id
  FROM profiles
  WHERE role = 'admin'
  ORDER BY created_at
  LIMIT 1;

  -- Create conversation
  INSERT INTO conversations (
    buyer_id,
    seller_id,
    phone_submission_id,
    last_message_at
  ) VALUES (
    p_user_id,
    v_admin_id,
    p_phone_submission_id,
    now()
  )
  RETURNING id INTO v_conversation_id;

  -- Update phone submission status
  UPDATE phone_submissions
  SET status = 'in_discussion'
  WHERE id = p_phone_submission_id;

  RETURN v_conversation_id;
END;
$$;