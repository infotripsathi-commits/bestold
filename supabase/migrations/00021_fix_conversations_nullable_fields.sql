-- Make seller_id nullable for phone submission conversations (admin chats)
ALTER TABLE conversations ALTER COLUMN seller_id DROP NOT NULL;

-- Add a check constraint to ensure either store_id or phone_submission_id is present
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_type_check;
ALTER TABLE conversations ADD CONSTRAINT conversations_type_check 
  CHECK (
    (store_id IS NOT NULL AND phone_submission_id IS NULL) OR
    (store_id IS NULL AND phone_submission_id IS NOT NULL)
  );