# Chat Notification System - Quick Start Guide

## What Was Added

### Visual Indicators
1. **Red Badge on Chat Icon** (Header)
   - Shows total unread message count
   - Updates in real-time
   - Displays "9+" for counts over 9

2. **Red Badge on Each Conversation**
   - Shows unread count per conversation
   - Clears when conversation is opened

### Browser Notifications
- Native push notifications when messages arrive
- Shows sender name and message preview
- Only appears if user has granted permission

### Auto-Read Tracking
- Messages automatically marked as read when viewed
- No manual action needed from user

## How It Works

### For Customers
1. **Vendor/Admin sends message** → Red badge appears on chat icon
2. **Customer clicks chat icon** → Sees conversation list with badges
3. **Customer opens conversation** → Messages marked as read, badge disappears
4. **If already viewing** → Browser notification pops up + auto-marked as read

### For Vendors/Admins
Same experience - see unread counts from customers

## Testing

### Quick Test (Customer-Vendor)
1. Log in as Customer A
2. Go to any product page
3. Click "Contact Seller"
4. Send a message
5. Log in as Vendor (different browser/incognito)
6. **Check:** Red badge appears on chat icon in header
7. Click chat icon
8. **Check:** Badge appears next to Customer A's conversation
9. Click conversation
10. **Check:** Badge disappears

### Quick Test (Customer-Admin)
1. Log in as Customer
2. Click "Sell Your Phone"
3. Submit phone details
4. Click "Start Chat"
5. Send message to admin
6. Log in as Admin
7. **Check:** Red badge on chat icon
8. Go to Admin Panel → Sell Phone → Submissions
9. Click "Chat" button
10. **Check:** Badge on conversation
11. Reply to customer
12. Log in as Customer
13. **Check:** Badge appears on customer's chat icon
14. **Check:** Browser notification (if permission granted)

## Browser Notification Setup

### First Time
1. Visit /chat page
2. Browser will ask: "Allow notifications?"
3. Click "Allow"
4. Done! Notifications will now appear

### If Blocked
1. Click lock icon in browser address bar
2. Find "Notifications" setting
3. Change to "Allow"
4. Refresh page

## Features Summary

| Feature | Status | Description |
|---------|--------|-------------|
| Unread Badge (Header) | ✅ | Shows total unread count on chat icon |
| Unread Badge (Conversation) | ✅ | Shows per-conversation unread count |
| Browser Notifications | ✅ | Native push notifications |
| Auto-Mark as Read | ✅ | Automatic when conversation viewed |
| Real-time Updates | ✅ | No page refresh needed |
| Persistent Tracking | ✅ | Survives page refreshes |

## Database Changes

### New Fields (messages table)
- `read` (boolean): Is message read?
- `read_at` (timestamp): When was it read?

### New Functions
- `get_unread_message_count(user_id)`: Total unread count
- `get_unread_by_conversation(user_id)`: Unread per conversation
- `mark_conversation_as_read(conversation_id, user_id)`: Mark all as read

## Code Changes

### New Component
- `src/components/UnreadBadge.tsx`: Reusable badge component

### Updated Components
- `src/components/layouts/Header.tsx`: Added badge to chat icon
- `src/pages/ChatPage.tsx`: Added unread tracking and notifications

### Updated API
- `src/db/api.ts`: Added 3 new functions for unread tracking

### Updated Types
- `src/types/types.ts`: Added `read` and `read_at` to Message interface

## Troubleshooting

### Badge Not Showing
- Check if messages exist in database
- Verify user has unread messages (read = false)
- Check browser console for errors

### Notifications Not Working
- Verify permission is granted (check browser settings)
- Must be on HTTPS (or localhost)
- User must be viewing conversation when message arrives

### Count Not Updating
- Check Supabase Realtime is enabled
- Verify real-time subscription is active
- Check browser console for errors

## Documentation

- **CHAT_NOTIFICATIONS.md**: Complete technical documentation
- **CHAT_SYSTEM_FIXES.md**: Original chat system fixes
- **TODO.md**: Implementation checklist

## Support

If issues occur:
1. Check browser console for errors
2. Verify database functions exist
3. Check RLS policies on messages table
4. Test notification permission in browser
5. Verify Supabase Realtime is enabled

## Next Steps

The notification system is fully functional. Users will now:
1. See visual indicators when they have unread messages
2. Receive browser notifications (if permitted)
3. Have messages automatically marked as read when viewed
4. Experience real-time updates without page refreshes

No additional configuration needed - the system is ready to use!
