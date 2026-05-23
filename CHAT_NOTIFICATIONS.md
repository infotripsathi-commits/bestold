# Chat Notification System

## Overview
This document describes the unread message notification system that alerts customers when they receive new messages from vendors or admins.

## Features Implemented

### 1. **Unread Message Tracking**
- Database fields added to `messages` table:
  - `read` (boolean): Tracks if message has been read
  - `read_at` (timestamp): When the message was marked as read
- Indexes created for fast unread queries
- Default value: `read = FALSE` for new messages

### 2. **Visual Indicators**

#### Badge on Chat Icon (Header)
- Red circular badge showing unread count
- Displays "9+" for counts over 9
- Positioned at top-right of MessageSquare icon
- Updates in real-time when new messages arrive
- Only visible when unread count > 0

#### Badge on Conversation List
- Each conversation shows its own unread count
- Red circular badge next to conversation name
- Displays "9+" for counts over 9
- Clears when conversation is opened

### 3. **Browser Push Notifications**
- Native browser notifications when new message arrives
- Shows sender name and message preview (first 100 characters)
- Only triggers if:
  - User has granted notification permission
  - Message is from someone else (not user's own message)
  - User is viewing the conversation (real-time)
- Permission requested on first chat page visit

### 4. **Auto-Mark as Read**
- Messages automatically marked as read when:
  - User opens a conversation
  - User receives a message while viewing that conversation
- Updates both database and UI state
- Triggers unread count refresh

### 5. **Real-time Updates**
- Unread counts update instantly via Supabase Realtime
- No page refresh needed
- Subscription to `messages` table changes
- Efficient: only reloads count, not all messages

## Database Functions

### `get_unread_message_count(p_user_id uuid)`
Returns total unread message count for a user across all conversations.

**Logic:**
- Counts messages where `read = FALSE`
- Excludes user's own messages
- Includes messages from:
  - Conversations where user is buyer or seller
  - Phone submission conversations where user is the submitter
  - All conversations if user is admin

**Returns:** INTEGER

### `get_unread_by_conversation(p_user_id uuid)`
Returns unread count per conversation for a user.

**Logic:**
- Groups unread messages by conversation_id
- Same filtering logic as above
- Used to show badges on conversation list

**Returns:** TABLE(conversation_id uuid, unread_count bigint)

### `mark_conversation_as_read(p_conversation_id uuid, p_user_id uuid)`
Marks all messages in a conversation as read for the user.

**Logic:**
- Updates all messages in conversation where:
  - `sender_id != p_user_id` (don't mark own messages)
  - `read = FALSE`
- Sets `read = TRUE` and `read_at = now()`

**Returns:** VOID

## Components

### `UnreadBadge.tsx`
Reusable component that displays unread count badge.

**Features:**
- Fetches unread count on mount
- Subscribes to real-time updates
- Auto-hides when count is 0
- Displays "9+" for counts > 9
- Styled with destructive color (red)

**Usage:**
```tsx
<Link to="/chat" className="relative">
  <MessageSquare className="h-5 w-5" />
  <UnreadBadge />
</Link>
```

### `ChatPage.tsx` Updates

**New State:**
```tsx
const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
```

**New Functions:**
- `loadUnreadCounts()`: Fetches unread counts for all conversations
- `markAsRead()`: Marks current conversation as read
- `showNotification()`: Displays browser notification
- `requestNotificationPermission()`: Asks user for notification permission

**Lifecycle:**
1. Load conversations and unread counts on mount
2. When conversation selected:
   - Load messages
   - Mark as read
   - Subscribe to new messages
3. When new message arrives:
   - Add to message list
   - Show notification if from someone else
   - Auto-mark as read

## API Functions (api.ts)

### `getUnreadMessageCount()`
```typescript
export async function getUnreadMessageCount(): Promise<number>
```
Returns total unread count for current user.

### `getUnreadByConversation()`
```typescript
export async function getUnreadByConversation(): Promise<Array<{
  conversation_id: string;
  unread_count: number;
}>>
```
Returns unread counts grouped by conversation.

### `markConversationAsRead(conversationId: string)`
```typescript
export async function markConversationAsRead(conversationId: string): Promise<void>
```
Marks all messages in conversation as read.

## User Flow

### Customer Receives Message from Vendor

1. **Vendor sends message** → Message inserted with `read = FALSE`
2. **Real-time trigger** → UnreadBadge component detects change
3. **Badge appears** → Red badge shows "1" on chat icon in header
4. **Customer clicks chat** → Navigates to /chat page
5. **Conversation list** → Shows badge "1" next to vendor's conversation
6. **Customer opens conversation** → `markAsRead()` called automatically
7. **Badge disappears** → Unread count updates to 0
8. **If customer is already viewing** → Browser notification pops up + auto-marked as read

### Customer Receives Message from Admin (Phone Submission)

Same flow as above, but:
- Conversation is linked to phone_submission_id instead of store_id
- Admin is the sender
- Conversation appears in customer's chat list

## Browser Notification Details

### Permission Request
- Triggered on first chat page visit (when no conversations exist)
- Uses standard Web Notifications API
- Permission persists across sessions

### Notification Content
```javascript
{
  title: "New message from [Sender Name]",
  body: "[First 100 characters of message]",
  icon: "/favicon.ico",
  tag: "chat-message" // Replaces previous notification
}
```

### When Notifications Show
- ✅ User has granted permission
- ✅ Message is from someone else
- ✅ User is viewing the conversation (real-time)
- ❌ User's own messages (no notification)
- ❌ Permission denied or not granted
- ❌ User not viewing the conversation (only badge updates)

## Testing Checklist

### Unread Badge Display
- [ ] Badge appears on header chat icon when unread messages exist
- [ ] Badge shows correct count (1, 2, 3, etc.)
- [ ] Badge shows "9+" when count exceeds 9
- [ ] Badge disappears when all messages are read
- [ ] Badge updates in real-time without page refresh

### Conversation List Badges
- [ ] Each conversation shows its own unread count
- [ ] Badge clears when conversation is opened
- [ ] Multiple conversations can have badges simultaneously
- [ ] Badge persists across page refreshes until read

### Browser Notifications
- [ ] Permission prompt appears on first visit
- [ ] Notification shows when message received while viewing conversation
- [ ] Notification displays sender name and message preview
- [ ] Notification does not show for user's own messages
- [ ] Notification respects user's permission choice

### Auto-Mark as Read
- [ ] Messages marked as read when conversation opened
- [ ] Messages marked as read when received while viewing
- [ ] Unread count updates immediately after marking as read
- [ ] Database `read` field updates correctly
- [ ] `read_at` timestamp is set

### Real-time Updates
- [ ] Unread count updates instantly when new message arrives
- [ ] No page refresh needed to see new unread count
- [ ] Multiple tabs/windows stay in sync
- [ ] Subscription cleanup works (no memory leaks)

### Edge Cases
- [ ] Works for customer-to-vendor chats
- [ ] Works for customer-to-admin chats (phone submissions)
- [ ] Admin sees unread counts from all conversations
- [ ] Seller sees unread counts from their store conversations
- [ ] Buyer sees unread counts from their initiated conversations
- [ ] No errors when user has no conversations
- [ ] No errors when conversation has no messages

## Troubleshooting

### Badge Not Showing
1. Check if messages exist with `read = FALSE`
2. Verify RLS policies allow reading messages
3. Check browser console for errors
4. Verify Supabase Realtime is enabled for messages table

### Notifications Not Working
1. Check browser notification permission
2. Verify user is viewing the conversation when message arrives
3. Check if notification API is supported (HTTPS required)
4. Look for console errors

### Count Not Updating
1. Verify Supabase Realtime subscription is active
2. Check if `mark_conversation_as_read` function is being called
3. Verify database trigger is working
4. Check RLS policies on messages table

### Performance Issues
1. Verify indexes exist on messages table
2. Check if too many real-time subscriptions are active
3. Monitor database query performance
4. Consider pagination for large conversation lists

## Future Enhancements

### Potential Improvements
- [ ] Email notifications for unread messages
- [ ] SMS notifications for urgent messages
- [ ] Push notifications for mobile app
- [ ] Notification sound when message arrives
- [ ] Desktop notification with action buttons (Reply, Mark as Read)
- [ ] Notification preferences (enable/disable per conversation)
- [ ] Unread message preview in notification dropdown
- [ ] Mark all as read button
- [ ] Notification history page

### Performance Optimizations
- [ ] Cache unread counts in localStorage
- [ ] Debounce real-time updates
- [ ] Lazy load conversation list
- [ ] Virtual scrolling for large message lists
- [ ] Optimize database queries with materialized views

## Security Considerations

### RLS Policies
- Users can only see unread counts for their own conversations
- Functions use `SECURITY DEFINER` but validate user ownership
- No direct table access - all through RPC functions

### Data Privacy
- Notification content limited to 100 characters
- No sensitive data in notification title
- Notifications respect browser privacy settings

### Performance
- Indexes prevent slow queries on large datasets
- Real-time subscriptions filtered by conversation_id
- Efficient query design (no N+1 problems)

## Migration Applied

### `add_message_read_tracking`
```sql
-- Add read tracking fields
ALTER TABLE messages ADD COLUMN read BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;

-- Create indexes
CREATE INDEX idx_messages_read ON messages(conversation_id, read) WHERE read = FALSE;
CREATE INDEX idx_messages_sender_read ON messages(sender_id, read);

-- Create RPC functions
CREATE FUNCTION get_unread_message_count(p_user_id uuid) RETURNS INTEGER;
CREATE FUNCTION get_unread_by_conversation(p_user_id uuid) RETURNS TABLE(...);
CREATE FUNCTION mark_conversation_as_read(p_conversation_id uuid, p_user_id uuid) RETURNS VOID;
```

## Rollback Instructions

If issues occur, rollback with:
```sql
-- Drop functions
DROP FUNCTION IF EXISTS mark_conversation_as_read(uuid, uuid);
DROP FUNCTION IF EXISTS get_unread_by_conversation(uuid);
DROP FUNCTION IF EXISTS get_unread_message_count(uuid);

-- Drop indexes
DROP INDEX IF EXISTS idx_messages_sender_read;
DROP INDEX IF EXISTS idx_messages_read;

-- Remove columns
ALTER TABLE messages DROP COLUMN IF EXISTS read_at;
ALTER TABLE messages DROP COLUMN IF EXISTS read;
```

## Support

For issues or questions:
1. Check browser console for errors
2. Verify database functions exist: `SELECT * FROM pg_proc WHERE proname LIKE '%unread%';`
3. Check RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'messages';`
4. Test notification permission: `console.log(Notification.permission);`
5. Verify Supabase Realtime: Check Supabase dashboard → Database → Replication
