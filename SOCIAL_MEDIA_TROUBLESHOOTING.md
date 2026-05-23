# Social Media Links - Troubleshooting Guide

## Issue: Social Media Fields Not Showing

If you're not seeing the social media link input fields on the Store Management page or the social media buttons on the Store Detail page, follow these steps:

## Step 1: Hard Refresh Your Browser

The most common issue is browser caching. Try these methods:

### Chrome / Edge / Brave
- **Windows/Linux**: Press `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac**: Press `Cmd + Shift + R`

### Firefox
- **Windows/Linux**: Press `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac**: Press `Cmd + Shift + R`

### Safari
- **Mac**: Press `Cmd + Option + R`

### Alternative Method (All Browsers)
1. Open Developer Tools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

## Step 2: Clear Browser Cache

If hard refresh doesn't work:

1. Open browser settings
2. Go to Privacy/Security section
3. Clear browsing data
4. Select "Cached images and files"
5. Clear data for "Last hour" or "Last 24 hours"
6. Restart browser

## Step 3: Verify Database Migration

Check if the database columns exist:

```sql
-- Run this query in Supabase SQL Editor
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'stores' 
  AND column_name IN ('youtube_url', 'facebook_url', 'instagram_url');
```

**Expected Result**: Should return 3 rows with the column names.

If no results, run the migration manually:

```sql
-- Add social media columns
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- Add URL validation
ALTER TABLE stores
ADD CONSTRAINT youtube_url_format CHECK (youtube_url IS NULL OR youtube_url ~* '^https?://'),
ADD CONSTRAINT facebook_url_format CHECK (facebook_url IS NULL OR facebook_url ~* '^https?://'),
ADD CONSTRAINT instagram_url_format CHECK (instagram_url IS NULL OR instagram_url ~* '^https?://');
```

## Step 4: Check Browser Console

1. Open Developer Tools (F12)
2. Go to "Console" tab
3. Look for any error messages
4. Check for messages like:
   - "Store data loaded: {...}" - Should show social media fields
   - "Saving store data: {...}" - Should include social media URLs

## Step 5: Verify You're on the Correct Page

### For Store Owners (Sellers)
- Navigate to: `/seller/store-management`
- You should see a form with these sections:
  1. Store Banner Image
  2. Store Name
  3. Description
  4. Location
  5. GPS Location
  6. Phone Number
  7. **Social Media Links** ← This section should be here
  8. Trade License Upload
  9. Shop Images

### For Customers
- Navigate to any store detail page: `/stores/{store-id}`
- Scroll down below the store description
- If the store has social media links, you'll see:
  - "Connect With Us" heading
  - Buttons for YouTube, Facebook, Instagram (whichever the store added)

## Step 6: Test with a New Store

If you have an existing store and still don't see the fields:

1. Open browser console (F12)
2. Go to Store Management page
3. Look for console message: "Store data loaded: {...}"
4. Check if the object includes:
   - `youtube_url: null` or `youtube_url: "..."`
   - `facebook_url: null` or `facebook_url: "..."`
   - `instagram_url: null` or `instagram_url: "..."`

If these fields are missing from the console output, the database query might not be selecting them.

## Step 7: Verify API Response

1. Open Developer Tools (F12)
2. Go to "Network" tab
3. Refresh the Store Management page
4. Look for API calls to Supabase
5. Check the response data includes social media fields

## Step 8: Check for JavaScript Errors

Look for these common errors in console:

### Error: "Cannot read property 'youtube_url' of undefined"
**Solution**: The store data isn't loading properly. Check authentication.

### Error: "youtube_url is not defined"
**Solution**: Form state not initialized. Hard refresh the page.

### No errors but fields still not showing
**Solution**: Check if you're logged in as a seller account.

## Step 9: Verify Account Type

Social media fields are only available for **Seller** accounts:

1. Check your account role in the database:
```sql
SELECT id, email, role FROM profiles WHERE email = 'your-email@example.com';
```

2. Role should be `'seller'`, not `'buyer'`

3. If you're a buyer, you need to:
   - Register a new seller account, OR
   - Contact admin to upgrade your account to seller

## Step 10: Test with Sample Data

Try adding social media links manually via SQL:

```sql
-- Update your store with test social media links
UPDATE stores 
SET 
  youtube_url = 'https://youtube.com/@testchannel',
  facebook_url = 'https://facebook.com/testpage',
  instagram_url = 'https://instagram.com/testprofile'
WHERE seller_id = 'YOUR_USER_ID';
```

Then visit your store detail page to see if the buttons appear.

## Common Issues & Solutions

### Issue: Fields show but data doesn't save
**Cause**: API function not including social media fields
**Solution**: Already fixed in latest code. Hard refresh browser.

### Issue: Social media section shows but is empty
**Cause**: Store hasn't added any social media links yet
**Solution**: This is normal. Add links in Store Management page.

### Issue: Buttons don't appear on Store Detail page
**Cause**: Store has no social media links saved
**Solution**: 
1. Go to Store Management
2. Add at least one social media URL
3. Click "Save Store"
4. Visit Store Detail page

### Issue: URL validation error when saving
**Cause**: URL doesn't start with http:// or https://
**Solution**: Use full URLs:
- ✅ `https://youtube.com/@channel`
- ❌ `youtube.com/@channel`
- ❌ `@channel`

## Debugging Checklist

- [ ] Hard refreshed browser (Ctrl+Shift+R)
- [ ] Cleared browser cache
- [ ] Checked browser console for errors
- [ ] Verified database columns exist
- [ ] Confirmed logged in as seller account
- [ ] Checked Network tab for API responses
- [ ] Tried different browser
- [ ] Verified on correct page (/seller/store-management)
- [ ] Checked if store data loads in console
- [ ] Tested saving with console logs

## Still Not Working?

If you've tried all the above steps and still don't see the social media fields:

1. **Check the code files**:
   - `/src/pages/seller/StoreManagementPage.tsx` - Should have social media input fields around line 535
   - `/src/pages/StoreDetailPage.tsx` - Should have "Connect With Us" section around line 253
   - `/src/db/api.ts` - createStore function should include social media fields around line 209

2. **Verify the migration was applied**:
   ```sql
   SELECT * FROM stores LIMIT 1;
   ```
   The result should include youtube_url, facebook_url, instagram_url columns.

3. **Check Supabase logs**:
   - Go to Supabase Dashboard
   - Navigate to Logs
   - Look for any errors related to stores table

4. **Contact Support**:
   - Provide browser console logs
   - Provide network tab screenshots
   - Mention which step you're stuck on

## Expected Behavior

### Store Management Page (Seller View)
```
┌─────────────────────────────────────┐
│ Store Banner Image                  │
├─────────────────────────────────────┤
│ Store Name: [____________]          │
│ Description: [____________]         │
│ Location: [____________]            │
│ GPS Location: [Detect]              │
│ Phone Number: [____________]        │
├─────────────────────────────────────┤
│ Social Media Links                  │
│ ─────────────────────────────────   │
│ YouTube: [https://youtube.com/...] │
│ Facebook: [https://facebook.com/...]│
│ Instagram: [https://instagram.com/.]│
├─────────────────────────────────────┤
│ Trade License: [Upload]             │
│ Shop Images: [Upload]               │
└─────────────────────────────────────┘
```

### Store Detail Page (Customer View)
```
┌─────────────────────────────────────┐
│ Store Name                          │
│ Description                         │
│ Location | Rating | Followers       │
├─────────────────────────────────────┤
│ Shop Images Gallery                 │
├─────────────────────────────────────┤
│ Connect With Us                     │
│ [YouTube] [Facebook] [Instagram]    │
├─────────────────────────────────────┤
│ Products                            │
└─────────────────────────────────────┘
```

## Technical Details

### Files Modified
- `src/types/types.ts` - Added social media fields to Store interface
- `src/db/api.ts` - Updated createStore function signature
- `src/pages/seller/StoreManagementPage.tsx` - Added input fields
- `src/pages/StoreDetailPage.tsx` - Added social media buttons
- Database migration - Added 3 columns with constraints

### Database Schema
```sql
CREATE TABLE stores (
  -- ... existing columns ...
  youtube_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  CONSTRAINT youtube_url_format CHECK (youtube_url IS NULL OR youtube_url ~* '^https?://'),
  CONSTRAINT facebook_url_format CHECK (facebook_url IS NULL OR facebook_url ~* '^https?://'),
  CONSTRAINT instagram_url_format CHECK (instagram_url IS NULL OR instagram_url ~* '^https?://')
);
```

---

**Last Updated**: March 28, 2026  
**Version**: 1.0

If this guide doesn't solve your issue, please provide:
1. Browser name and version
2. Console error messages (if any)
3. Screenshot of the Store Management page
4. Result of the database query in Step 3
