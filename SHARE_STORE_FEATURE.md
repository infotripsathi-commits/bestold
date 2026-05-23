# Share Store Feature Documentation

## Overview

The Share Store feature allows both store owners (sellers) and customers to easily share store pages with others through multiple channels including social media, messaging apps, and direct link copying.

## Features

### 🎯 Core Functionality

1. **Multiple Share Options**
   - Copy store link to clipboard
   - Share via WhatsApp
   - Share via Facebook
   - Share via Twitter
   - Share via Telegram
   - Share via Email

2. **Native Share API Support**
   - Automatically uses device's native share dialog on mobile devices
   - Seamless integration with installed apps
   - Fallback to custom dialog on desktop browsers

3. **Smart Share Content**
   - Includes store name in share title
   - Includes store description (truncated to 100 characters)
   - Includes direct link to store page
   - Optimized for each platform

## Where to Find Share Button

### For Store Owners (Sellers)

1. **Seller Dashboard** (`/seller/dashboard`)
   - Located in the "Quick Actions" card
   - Appears as "Share Store" button with share icon
   - Only visible if store exists

2. **Store Management Page** (`/seller/store-management`)
   - Located in the card header (top right)
   - Appears as small outline button
   - Only visible for existing stores (not during creation)

### For Customers

1. **Store Detail Page** (`/stores/{store-id}`)
   - Located in the store header section
   - Positioned at the top of the action buttons column
   - Visible to all visitors (logged in or not)

## How to Use

### For Store Owners

#### From Seller Dashboard:
1. Log in to your seller account
2. Navigate to Seller Dashboard
3. Find "Quick Actions" card
4. Click "Share Store" button
5. Choose your preferred sharing method

#### From Store Management Page:
1. Go to "My Store" page
2. Look for the share button in the top right corner
3. Click to open share dialog
4. Select sharing option

### For Customers

1. Visit any store detail page
2. Look for the "Share Store" button near the top
3. Click the button
4. Choose how you want to share:
   - **Copy Link**: Copies store URL to clipboard
   - **WhatsApp**: Opens WhatsApp with pre-filled message
   - **Facebook**: Opens Facebook share dialog
   - **Twitter**: Opens Twitter with pre-filled tweet
   - **Telegram**: Opens Telegram share interface
   - **Email**: Opens email client with pre-filled content

## Share Dialog Interface

### Desktop Experience

When clicking the share button on desktop, a dialog appears with:

```
┌─────────────────────────────────────┐
│ Share [Store Name]                  │
│ Share this store with your friends  │
├─────────────────────────────────────┤
│ Store Link                          │
│ [https://bestold.com/stores/123] 📋 │
├─────────────────────────────────────┤
│ Share via                           │
│ ┌──────────┐ ┌──────────┐          │
│ │ WhatsApp │ │ Facebook │          │
│ └──────────┘ └──────────┘          │
│ ┌──────────┐ ┌──────────┐          │
│ │ Twitter  │ │ Telegram │          │
│ └──────────┘ └──────────┘          │
│ ┌─────────────────────┐             │
│ │      Email          │             │
│ └─────────────────────┘             │
└─────────────────────────────────────┘
```

### Mobile Experience

On mobile devices with native share support:
- Clicking "Share Store" opens the device's native share sheet
- Shows all installed apps that support sharing
- Includes system share options (AirDrop, Nearby Share, etc.)

## Share Content Format

### WhatsApp
```
[Store Name] - [Store Description]
https://bestold.com/stores/[store-id]
```

### Facebook
- Opens Facebook share dialog with store URL
- Facebook automatically fetches page metadata

### Twitter
```
[Store Name] - [Store Description]
https://bestold.com/stores/[store-id]
```

### Telegram
```
[Store Name] - [Store Description]
https://bestold.com/stores/[store-id]
```

### Email
```
Subject: Check out [Store Name] on BestOld

Body:
[Store Name] - [Store Description]

https://bestold.com/stores/[store-id]
```

## Technical Details

### Component: ShareStoreButton

**Location**: `/src/components/ShareStoreButton.tsx`

**Props**:
```typescript
interface ShareStoreButtonProps {
  store: Store;                    // Store object (required)
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';  // Button style
  size?: 'default' | 'sm' | 'lg' | 'icon';                  // Button size
  className?: string;              // Additional CSS classes
  showIcon?: boolean;              // Show share icon (default: true)
  showText?: boolean;              // Show "Share Store" text (default: true)
}
```

**Usage Example**:
```tsx
import ShareStoreButton from '@/components/ShareStoreButton';

// Basic usage
<ShareStoreButton store={store} />

// Custom styling
<ShareStoreButton 
  store={store} 
  variant="outline" 
  size="lg"
  className="w-full"
/>

// Icon only
<ShareStoreButton 
  store={store} 
  size="icon"
  showText={false}
/>
```

### Browser Compatibility

**Web Share API** (Native sharing):
- ✅ Chrome/Edge (Android, Windows 11+)
- ✅ Safari (iOS, macOS)
- ✅ Firefox (Android)
- ❌ Firefox (Desktop) - Uses fallback dialog
- ❌ Older browsers - Uses fallback dialog

**Fallback Dialog**:
- Works on all modern browsers
- Uses shadcn/ui Dialog component
- Fully responsive design

### Features

1. **Clipboard API**
   - Copies link to clipboard
   - Shows success toast notification
   - Visual feedback with checkmark icon

2. **URL Encoding**
   - Properly encodes URLs and text
   - Handles special characters
   - Prevents broken links

3. **Security**
   - Opens external links in new tab
   - Uses `noopener,noreferrer` for security
   - No tracking or analytics

## Benefits

### For Store Owners

1. **Increased Visibility**
   - Easy to share store with potential customers
   - Reach wider audience through social media
   - Word-of-mouth marketing made simple

2. **Professional Appearance**
   - Shows store is modern and tech-savvy
   - Provides convenient sharing options
   - Enhances customer experience

3. **Marketing Tool**
   - Share on business social media accounts
   - Include in email signatures
   - Add to business cards via QR code

### For Customers

1. **Easy Recommendations**
   - Share favorite stores with friends
   - Recommend stores in group chats
   - Help others discover quality sellers

2. **Convenient Bookmarking**
   - Copy link to save for later
   - Share with family members
   - Send to friends looking for specific items

## Best Practices

### For Store Owners

1. **Optimize Store Description**
   - First 100 characters appear in shares
   - Make it compelling and clear
   - Include key selling points

2. **Use High-Quality Banner**
   - Banner image may appear in social previews
   - Use professional, eye-catching images
   - Ensure image represents your brand

3. **Share Strategically**
   - Share on your business social media
   - Include in email newsletters
   - Add to business website

4. **Track Results**
   - Monitor traffic from shared links
   - See which platforms work best
   - Adjust marketing strategy accordingly

### For Customers

1. **Add Personal Message**
   - When sharing via WhatsApp/Telegram, add why you recommend
   - Personalize the message for the recipient
   - Explain what makes the store special

2. **Share Responsibly**
   - Only share stores you've actually visited
   - Be honest about your experience
   - Don't spam groups with store links

## Troubleshooting

### Issue: Share button not visible

**Possible Causes**:
1. Store doesn't exist yet (for sellers)
2. Page hasn't loaded completely
3. Browser cache issue

**Solutions**:
1. Ensure store is created and saved
2. Refresh the page
3. Hard refresh browser (Ctrl+Shift+R)

### Issue: Copy link doesn't work

**Cause**: Browser doesn't support Clipboard API or permissions denied

**Solution**:
1. Manually select and copy the URL from the input field
2. Check browser permissions for clipboard access
3. Try a different browser

### Issue: Native share doesn't appear on mobile

**Cause**: Browser doesn't support Web Share API

**Solution**:
- The fallback dialog will appear automatically
- Use the dialog to share via social media
- All functionality is still available

### Issue: Shared link doesn't work

**Cause**: URL encoding issue or store deleted

**Solutions**:
1. Verify store still exists
2. Check if store is approved (not pending/rejected)
3. Try copying link again
4. Contact support if issue persists

## Privacy & Security

1. **No Tracking**
   - Share feature doesn't track who shares or where
   - No analytics or data collection
   - Privacy-focused implementation

2. **Secure Links**
   - All external links open with security attributes
   - No referrer information leaked
   - Protected against reverse tabnabbing

3. **User Control**
   - Users choose what to share and where
   - No automatic sharing or posting
   - Full control over share content

## Future Enhancements

Potential future additions:

1. **QR Code Generation**
   - Generate QR code for store page
   - Download or print QR code
   - Add to physical marketing materials

2. **Share Analytics**
   - Track share button clicks
   - See which platforms are most popular
   - Monitor share-driven traffic

3. **Custom Share Messages**
   - Allow sellers to customize share text
   - Add promotional messages
   - Include special offers in shares

4. **Social Media Previews**
   - Optimize Open Graph tags
   - Custom images for each platform
   - Rich previews on social media

5. **Referral Tracking**
   - Track customers from shared links
   - Reward sellers for successful referrals
   - Gamify store promotion

## Support

If you encounter any issues with the Share Store feature:

1. **Check Documentation**: Review this guide thoroughly
2. **Browser Console**: Check for error messages (F12)
3. **Try Different Browser**: Test in another browser
4. **Contact Support**: Provide details about the issue

## Changelog

### Version 1.0 (March 28, 2026)
- ✅ Initial release
- ✅ Support for 5 social platforms + email
- ✅ Native share API integration
- ✅ Clipboard copy functionality
- ✅ Responsive dialog design
- ✅ Added to Store Detail Page
- ✅ Added to Store Management Page
- ✅ Added to Seller Dashboard

---

**Last Updated**: March 28, 2026  
**Version**: 1.0  
**Status**: ✅ Live and Fully Functional
