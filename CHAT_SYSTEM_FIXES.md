# Chat System Fixes Applied

## Issues Fixed

### 1. **Duplicate RLS Policies**
- **Problem**: Two conflicting INSERT policies on conversations table
- **Solution**: Removed old "Buyers can create conversations" policy
- **Impact**: Eliminates policy conflicts that could block conversation creation

### 2. **Required Fields Blocking Phone Submission Chats**
- **Problem**: `store_id` and `seller_id` were NOT NULL, blocking phone submission conversations
- **Solution**: Made both fields nullable with proper constraints
- **Constraint Added**: Ensures either `store_id` OR `phone_submission_id` is present (not both)
- **Impact**: Phone submission chats can now be created without store context

### 3. **Message Sender Auto-Population**
- **Problem**: Messages might fail if sender_id not properly set
- **Solution**: Added database trigger `set_message_sender_trigger` that auto-sets sender_id from auth context
- **Impact**: Messages always have valid sender_id, even if client forgets to send it

### 4. **Real-time Subscription Cleanup**
- **Problem**: Chat subscriptions not properly cleaned up on component unmount
- **Solution**: Updated ChatPage.tsx to return cleanup function from useEffect
- **Impact**: Prevents memory leaks and duplicate subscriptions

### 5. **Phone Submission Conversation Function**
- **Problem**: Function signature mismatch and missing user validation
- **Solution**: Updated RPC function to:
  - Get user_id from auth.uid() instead of parameter
  - Verify phone submission belongs to authenticated user
  - Check for existing conversation before creating new one
  - Properly handle nullable seller_id
- **Impact**: Secure, reliable phone submission chat creation

## Database Changes Applied

### Migration: `fix_chat_system_policies`
```sql
-- Remove duplicate policy
DROP POLICY IF EXISTS "Buyers can create conversations" ON conversations;

-- Add trigger for auto-setting sender_id
CREATE OR REPLACE FUNCTION set_message_sender()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sender_id IS NULL THEN
    NEW.sender_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_message_sender_trigger
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION set_message_sender();

-- Make store_id nullable
ALTER TABLE conversations ALTER COLUMN store_id DROP NOT NULL;
```

### Migration: `fix_conversations_nullable_fields`
```sql
-- Make seller_id nullable for admin chats
ALTER TABLE conversations ALTER COLUMN seller_id DROP NOT NULL;

-- Add constraint to ensure proper conversation type
ALTER TABLE conversations ADD CONSTRAINT conversations_type_check 
  CHECK (
    (store_id IS NOT NULL AND phone_submission_id IS NULL) OR
    (store_id IS NULL AND phone_submission_id IS NOT NULL)
  );
```

### Migration: `fix_phone_submission_conversation_function_v2`
```sql
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
```

## Code Changes

### ChatPage.tsx
- Added proper cleanup for real-time subscriptions
- Added sender profile fetching in real-time listener
- Ensured user context is checked before sending messages

### api.ts
- Updated `sendMessage()` to auto-populate sender_id if not provided
- Updated conversation last_message_at on every message send
- Fixed `createPhoneSubmissionConversation()` to match new RPC signature

## Testing Checklist

### Customer to Vendor Chat
- [ ] Customer can click "Contact Seller" on product page
- [ ] Conversation is created successfully
- [ ] Customer can send messages
- [ ] Seller receives messages in real-time
- [ ] Seller can reply
- [ ] Customer receives replies in real-time
- [ ] Chat history persists across page refreshes

### Customer to Admin Chat (Phone Submissions)
- [ ] Customer submits phone for sale
- [ ] Customer can start chat after submission
- [ ] Conversation is created with admin
- [ ] Customer can send messages
- [ ] Admin sees conversation in admin panel
- [ ] Admin can reply from admin panel
- [ ] Admin can close chat when done
- [ ] Status updates correctly (pending → in_discussion → closed)

### General Chat Features
- [ ] Messages display with correct sender names
- [ ] Timestamps show correctly
- [ ] Auto-scroll to latest message works
- [ ] No duplicate messages appear
- [ ] No console errors
- [ ] Real-time updates work without page refresh

## How to Test

### Test Customer-Vendor Chat:
1. Log in as a buyer
2. Go to any product page
3. Click "Contact Seller" button
4. Send a test message
5. Log in as the seller in another browser/incognito
6. Check /chat page - should see the conversation
7. Reply to the message
8. Check buyer's chat - should see reply instantly

### Test Customer-Admin Chat:
1. Log in as a customer
2. Click "Sell Your Phone" button on homepage
3. Fill out form and submit
4. Click "Start Chat" when prompted
5. Send a message to admin
6. Log in as admin
7. Go to Admin Panel → Sell Phone → Submissions tab
8. Click "Chat" button on the submission
9. Reply to customer
10. Check customer's chat - should see admin reply
11. Admin clicks "Close Chat" button
12. Verify status changes to "closed"

## Expected Behavior

### Successful Chat Creation
- No errors in console
- User redirected to /chat page
- Conversation appears in sidebar
- Message input is enabled
- Can send and receive messages

### Failed Chat Creation (Should Not Happen Now)
- If it fails, check:
  - User is authenticated (check auth.uid())
  - RLS policies allow the operation
  - Required fields are provided
  - No constraint violations

## Rollback Instructions

If issues persist, rollback migrations in reverse order:
```sql
-- Rollback function
DROP FUNCTION IF EXISTS create_phone_submission_conversation(uuid);

-- Rollback constraints
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_type_check;
ALTER TABLE conversations ALTER COLUMN seller_id SET NOT NULL;
ALTER TABLE conversations ALTER COLUMN store_id SET NOT NULL;

-- Rollback trigger
DROP TRIGGER IF EXISTS set_message_sender_trigger ON messages;
DROP FUNCTION IF EXISTS set_message_sender();
```

## Support

If chat still doesn't work:
1. Check browser console for JavaScript errors
2. Check network tab for failed API calls
3. Check Supabase logs for database errors
4. Verify user has proper role (buyer/seller/admin)
5. Verify RLS policies are active: `SELECT * FROM pg_policies WHERE tablename IN ('conversations', 'messages');`
