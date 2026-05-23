-- Remove old duplicate policy
DROP POLICY IF EXISTS "Buyers can create conversations" ON conversations;

-- Ensure sendMessage function properly handles sender_id
-- Update messages table to have a trigger that auto-sets sender_id if not provided
CREATE OR REPLACE FUNCTION set_message_sender()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sender_id IS NULL THEN
    NEW.sender_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_message_sender_trigger ON messages;
CREATE TRIGGER set_message_sender_trigger
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION set_message_sender();

-- Make sure store_id can be null for phone submission conversations
ALTER TABLE conversations ALTER COLUMN store_id DROP NOT NULL;