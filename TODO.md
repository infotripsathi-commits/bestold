# Task: Build BestOld - Second-hand Goods Marketplace Platform

## Plan
- [x] Step 1: Initialize Supabase and create database schema
- [x] Step 2: Set up authentication system
- [x] Step 3: Create type definitions and API layer
- [x] Step 4: Create layout components and routing
- [x] Step 5: Implement buyer-facing pages
- [x] Step 6: Implement seller-facing pages
- [x] Step 7: Implement admin panel
- [x] Step 8: Implement real-time chat system
- [x] Step 9: No placeholder images needed - using icons
- [x] Step 10: Branding Update to "BestOld"
- [x] Step 11: Location Management System
- [x] Step 12: Footer Management System
- [x] Step 13: Fix Signup Database Error
- [x] Step 14: Sell Your Phone Feature
- [x] Step 15: Fix Storage Bucket and Add Variants
- [x] Step 16: Fix WhatsApp Message Truncation
- [x] Step 17: Send Full Image URLs to WhatsApp
- [x] Step 18: Add Phone Submission Chat Feature
  - [x] Add phone_submission_id to conversations table
  - [x] Add status field to phone_submissions (pending, in_discussion, quoted, accepted, rejected, closed)
  - [x] Create phone submission conversation function
  - [x] Update RLS policies for phone submission chats
  - [x] Create PhoneSubmissionChatPage with real-time messaging
  - [x] Add "Start Chat" prompt after form submission
  - [x] Add Chat button in admin submissions tab
  - [x] Add status badges in admin panel
  - [x] Add "Close Chat" button for admin
  - [x] Add "Open Chat" button in submission details
  - [x] Real-time message updates using Supabase Realtime
- [x] Step 19: Run lint and fix all issues
- [x] Step 20: Fix Chat System Issues and Add Notifications
  - [x] Remove duplicate RLS policies on conversations table
  - [x] Make store_id and seller_id nullable for phone submission chats
  - [x] Add database trigger to auto-set message sender_id
  - [x] Fix real-time subscription cleanup in ChatPage
  - [x] Update phone submission conversation RPC function
  - [x] Add constraint to ensure conversation type integrity
  - [x] Update sendMessage to auto-populate sender and update last_message_at
  - [x] Add unread message tracking (read, read_at fields)
  - [x] Create database functions for unread counts
  - [x] Implement UnreadBadge component
  - [x] Add badge to header chat icon
  - [x] Add badges to conversation list
  - [x] Implement browser push notifications
  - [x] Auto-mark messages as read when viewed
  - [x] Real-time unread count updates

## Chat System Fixes and Notifications (Step 20)
- **Issue**: Chat not working + customers couldn't see when admins/vendors sent messages
- **Root Causes**:
  1. Duplicate RLS policies causing conflicts
  2. Required fields (store_id, seller_id) blocking phone submission chats
  3. Missing sender_id auto-population
  4. Subscription cleanup issues
  5. No unread message tracking or notifications
- **Solutions Applied**:
  1. Removed old "Buyers can create conversations" policy
  2. Made store_id and seller_id nullable with proper constraints
  3. Added database trigger to auto-set sender_id from auth context
  4. Fixed useEffect cleanup in ChatPage
  5. Updated RPC function for secure phone submission chat creation
  6. **Added unread message tracking system:**
     - Database fields: `read` (boolean), `read_at` (timestamp)
     - RPC functions: `get_unread_message_count`, `get_unread_by_conversation`, `mark_conversation_as_read`
     - UnreadBadge component with real-time updates
     - Badge on header chat icon showing total unread count
     - Badges on conversation list showing per-conversation unread counts
     - Browser push notifications when messages arrive
     - Auto-mark as read when conversation is viewed
     - Real-time updates via Supabase Realtime subscriptions
- **Database Changes**: 4 migrations applied successfully
- **New Features**:
  - Visual notification badges (red circles with counts)
  - Browser push notifications with sender name and message preview
  - Automatic read status tracking
  - Real-time unread count updates
- **Documentation**: 
  - See CHAT_SYSTEM_FIXES.md for chat system fixes
  - See CHAT_NOTIFICATIONS.md for notification system details

## Notes
- **Application Name**: BestOld (rebranded from SecondSwap)
- **Logo**: ShoppingBag icon with "BestOld" text
- Application requires login, image upload, and real-time chat functionality
- Using Supabase for backend with email-based authentication
- Three user roles: buyer, seller, admin
- Sellers can also act as buyers
- Real-time chat using Supabase Realtime
- Product images stored in Supabase Storage (max 5 per product, 1MB limit with auto-compression)
- **Location Management**: Admin-controlled via /admin/locations page
- **Footer Management**: Admin-controlled via /admin/settings page
- **Signup Fix**: Database trigger runs with SECURITY DEFINER to bypass RLS
- **Sell Phone Feature**: Complete phone buyback system with chat
  - Button on homepage opens form dialog
  - Fields: Brand, Model, **Variant (RAM/Storage)**, Condition, Age, **6 Images**, Contact Details
  - **Storage**: Dedicated phone-images bucket with proper RLS policies
  - **Images**: 6 upload slots (Front, Back, Left Side, Right Side, Top, Bottom)
  - **Variants**: 9 pre-seeded options (3GB/32GB to 16GB/1TB)
  - **WhatsApp Integration**: Multi-message approach for complete details
    - **Message 1**: Phone details, customer contact, submission ID, timestamp
    - **Messages 2-4**: Full image URLs (2 per message) with labels
    - Opens 3-4 WhatsApp tabs automatically with 2-second delays
    - Admin receives ALL information including clickable image URLs
  - **Chat System**: Customer and admin can chat about submission
    - After submission, customer prompted to start chat
    - Real-time messaging with Supabase Realtime
    - Chat accessible at /phone-submission-chat/:submissionId
    - Admin can view all chats from submissions tab
    - Admin can close chat when done (status changes to "closed")
    - Status tracking: pending → in_discussion → quoted → accepted/rejected/closed
  - Submissions sent to WhatsApp: +918167865019
  - All options customizable from admin panel at /admin/sell-phone
  - 10 pre-seeded brands, 4 conditions, 5 age options, 9 variants
  - Images uploaded to phone-images bucket (not product-images)
  - **Admin Panel**: Submissions tab shows all submissions with status, chat, and details buttons
  - **Documentation**: WHATSAPP_INTEGRATION.md explains the multi-message flow
- Reviews limited to one per buyer per store
- First registered user automatically becomes admin
- All core features implemented successfully

