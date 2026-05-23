# Store Social Media Integration

## Overview
Store owners can now add their social media links (YouTube, Facebook, Instagram) to their store profiles. These links are displayed on the Store Detail page, allowing customers to connect with stores on their preferred social platforms.

## Features Added

### 1. Database Schema
Added three new columns to the `stores` table:
- `youtube_url` (TEXT) - Store's YouTube channel or video URL
- `facebook_url` (TEXT) - Store's Facebook page URL
- `instagram_url` (TEXT) - Store's Instagram profile URL

**Validation**: All URLs must start with `http://` or `https://` (enforced by database constraints)

### 2. Store Management Page Updates
**Location**: `/seller/store-management`

**New Section**: "Social Media Links"
- Added input fields for YouTube, Facebook, and Instagram URLs
- Placed after phone number field with clear section heading
- Placeholder text guides users on correct URL format
- Optional fields - stores can add any combination of social links

**Form Updates**:
- Form state includes new social media fields
- Data persists when editing existing stores
- Validation ensures proper URL format
- All fields are optional

### 3. Store Detail Page Updates
**Location**: `/stores/:id`

**New Section**: "Connect With Us"
- Displays social media buttons only if at least one link is provided
- Each button shows the platform icon and name
- Opens links in new tab with security attributes (`target="_blank" rel="noopener noreferrer"`)
- Responsive button layout with proper spacing

**Social Media Icons**:
- YouTube: Red play button icon
- Facebook: Blue Facebook logo
- Instagram: Gradient Instagram logo
- All icons use official brand SVG paths

### 4. TypeScript Types
Updated `Store` interface in `/src/types/types.ts`:
```typescript
export interface Store {
  // ... existing fields
  youtube_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  // ... rest of fields
}
```

## User Experience

### For Store Owners
1. Navigate to **My Store** page
2. Scroll to "Social Media Links" section
3. Enter URLs for desired platforms:
   - YouTube: `https://youtube.com/@yourchannel`
   - Facebook: `https://facebook.com/yourpage`
   - Instagram: `https://instagram.com/yourprofile`
4. Click "Save Store" to update
5. Links immediately appear on store detail page

### For Customers
1. Visit any store detail page
2. Scroll below store description and shop images
3. See "Connect With Us" section (if store has social links)
4. Click any social media button to visit store's profile
5. Opens in new tab without leaving BestOld

## Technical Implementation

### Database Migration
```sql
-- Add social media link columns
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- Add URL format validation
ALTER TABLE stores
ADD CONSTRAINT youtube_url_format CHECK (youtube_url IS NULL OR youtube_url ~* '^https?://'),
ADD CONSTRAINT facebook_url_format CHECK (facebook_url IS NULL OR facebook_url ~* '^https?://'),
ADD CONSTRAINT instagram_url_format CHECK (instagram_url IS NULL OR instagram_url ~* '^https?://');
```

### Form State Management
```typescript
const [formData, setFormData] = useState({
  name: '',
  description: '',
  location: '',
  contact_info: '',
  phone_number: '',
  youtube_url: '',
  facebook_url: '',
  instagram_url: '',
});
```

### Conditional Rendering
Social media section only displays if at least one link exists:
```typescript
{(store.youtube_url || store.facebook_url || store.instagram_url) && (
  <div className="mt-6 pt-6 border-t">
    <h3>Connect With Us</h3>
    {/* Social media buttons */}
  </div>
)}
```

## Benefits

### For Stores
- **Increased Visibility**: Customers can follow on multiple platforms
- **Brand Building**: Showcase products and content across channels
- **Customer Engagement**: Direct connection through preferred platforms
- **Trust Building**: Verified social presence adds credibility
- **Marketing**: Drive traffic to social media content

### For Customers
- **Multi-Channel Access**: Connect on preferred platform
- **Content Discovery**: View store's social media content
- **Updates**: Follow for new product announcements
- **Community**: Engage with store's social community
- **Verification**: Check store authenticity through social profiles

## Best Practices

### For Store Owners
1. **Use Official URLs**: Link to your official business pages
2. **Keep Active**: Maintain active social media presence
3. **Consistent Branding**: Use same store name across platforms
4. **Regular Updates**: Post regularly to engage followers
5. **Respond Promptly**: Reply to messages and comments

### URL Format Examples
- ✅ YouTube: `https://youtube.com/@storename` or `https://youtube.com/c/storename`
- ✅ Facebook: `https://facebook.com/storename` or `https://fb.me/storename`
- ✅ Instagram: `https://instagram.com/storename` or `https://instagr.am/storename`
- ❌ Invalid: `youtube.com/channel` (missing https://)
- ❌ Invalid: `@storename` (not a full URL)

## Security Considerations

### URL Validation
- Database constraints ensure URLs start with `http://` or `https://`
- Frontend validates URL format before submission
- Prevents injection of malicious scripts

### Link Safety
- All external links open in new tab (`target="_blank"`)
- Security attribute prevents access to opener (`rel="noopener noreferrer"`)
- Protects against reverse tabnabbing attacks

### Privacy
- Social media links are public information
- Displayed to all visitors (logged in or not)
- Store owners control which platforms to share

## Future Enhancements

Potential improvements:
- **More Platforms**: Add Twitter/X, LinkedIn, TikTok, WhatsApp Business
- **Link Verification**: Verify ownership of social media accounts
- **Social Feed**: Display recent posts from social media
- **Analytics**: Track clicks on social media links
- **QR Codes**: Generate QR codes for social media profiles
- **Social Login**: Allow customers to login via social media
- **Share Buttons**: Share store on social media platforms
- **Badges**: Display follower count from social platforms

## Testing Checklist

- ✅ Store owners can add social media URLs
- ✅ URLs are validated for proper format
- ✅ Links persist when editing store
- ✅ Social media section displays on store detail page
- ✅ Buttons open links in new tab
- ✅ Icons display correctly for each platform
- ✅ Section hidden if no social links provided
- ✅ Responsive layout on mobile devices
- ✅ Database constraints prevent invalid URLs
- ✅ All 116 files pass lint checks

## Support

### Common Issues

**Q: My social media links aren't showing**
A: Ensure URLs start with `https://` and are saved in Store Management page

**Q: Can I add multiple YouTube channels?**
A: Currently only one URL per platform. Use your main channel.

**Q: Do I need all three platforms?**
A: No, add only the platforms you use. All fields are optional.

**Q: Can customers message me on social media?**
A: Yes, they can visit your profiles and contact you there.

**Q: How do I remove a social media link?**
A: Clear the URL field in Store Management and save.

---

**Last Updated**: March 28, 2026  
**Version**: 1.0
