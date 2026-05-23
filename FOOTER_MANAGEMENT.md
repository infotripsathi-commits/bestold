# Footer Management System

## Overview
BestOld now features a professional, customizable footer that displays on all pages. All footer content is managed through the admin panel at `/admin/settings`, making it easy to update contact information, social links, and legal pages without touching code.

## Features

### Footer Sections
1. **About Section**
   - Site name and tagline
   - Brief description about the platform

2. **Quick Links**
   - About Us page link
   - Privacy Policy link
   - Terms & Conditions link

3. **Contact Information**
   - Business address with map pin icon
   - Phone number (clickable tel: link)
   - Email address (clickable mailto: link)

4. **Social Media**
   - Facebook
   - Instagram
   - YouTube
   - Twitter/X
   - Icons with hover effects

5. **Copyright**
   - Customizable copyright text
   - Automatically displays current year

## Admin Management

### Access
Navigate to **Admin Panel → Settings** (`/admin/settings`)

### Settings Tabs

#### 1. General Tab
- **Site Name**: Your platform name (e.g., "BestOld")
- **Site Tagline**: Brief tagline (e.g., "Buy & Sell Second-Hand Goods")
- **Copyright Text**: Footer copyright notice

#### 2. Footer Content Tab
- **About Us Description**: Text displayed in the about section (supports multi-line)
- **About Page URL**: Link to full about page (e.g., `/about`)
- **Privacy Policy URL**: Link to privacy policy page (e.g., `/privacy-policy`)
- **Terms & Conditions URL**: Link to terms page (e.g., `/terms-conditions`)

#### 3. Social Links Tab
- **Facebook**: Full URL to your Facebook page
- **Instagram**: Full URL to your Instagram profile
- **YouTube**: Full URL to your YouTube channel
- **Twitter/X**: Full URL to your Twitter profile

**Note**: Leave any social link empty to hide that icon from the footer

#### 4. Contact Info Tab
- **Business Address**: Full address (supports multi-line)
- **Phone Number**: Contact phone with country code
- **Email Address**: Contact email address

### How to Update

1. Navigate to `/admin/settings`
2. Select the appropriate tab (General, Footer Content, Social Links, or Contact Info)
3. Update the fields you want to change
4. Click **"Save Changes"** button (top-right or bottom)
5. Changes appear immediately on all pages

## Database Structure

All settings are stored in the `site_settings` table:

```sql
create table site_settings (
  id uuid primary key,
  key text unique not null,
  value text,
  category text not null,
  created_at timestamptz,
  updated_at timestamptz
);
```

### Default Settings Keys

**General Category:**
- `site_name`: Platform name
- `site_tagline`: Platform tagline

**Footer Category:**
- `footer_about_us`: About section text
- `footer_about_page`: About page URL
- `footer_privacy_policy`: Privacy policy URL
- `footer_terms_conditions`: Terms & conditions URL
- `footer_address`: Business address
- `footer_phone`: Phone number
- `footer_email`: Email address
- `footer_facebook`: Facebook URL
- `footer_instagram`: Instagram URL
- `footer_youtube`: YouTube URL
- `footer_twitter`: Twitter URL
- `footer_copyright`: Copyright text

## Footer Component

The footer is automatically included on all pages via `App.tsx`. It:
- Fetches settings from the database on mount
- Displays only non-empty fields
- Hides social icons if URLs are not provided
- Responsive design (stacks on mobile, grid on desktop)
- Professional styling with hover effects

### Layout
- **Desktop**: 4-column grid (About, Quick Links, Contact, Social)
- **Mobile**: Single column stack
- **Spacing**: Proper padding and margins for readability
- **Icons**: Lucide React icons with brand colors on hover

## Customization Tips

### Social Media
- Only add URLs for platforms you actively use
- Use full URLs including `https://`
- Icons automatically hide if URL is empty

### Contact Information
- Use international format for phone numbers: `+1 (555) 123-4567`
- Address can be multi-line for better readability
- All contact fields are optional

### Legal Pages
- Create actual pages for Privacy Policy and Terms & Conditions
- Update URLs in settings to point to these pages
- Links automatically hide if URLs are empty

### Copyright
- Use format: `© 2026 YourBrand. All rights reserved.`
- Year can be hardcoded or use current year
- Supports custom text for different legal requirements

## Best Practices

1. **Keep It Concise**: Footer about text should be 2-3 sentences max
2. **Verify Links**: Test all URLs after updating
3. **Consistent Branding**: Match site name with logo and header
4. **Complete Contact Info**: Provide at least 2 contact methods
5. **Active Social Only**: Only link to actively maintained social profiles
6. **Legal Compliance**: Ensure privacy policy and terms pages exist before linking

## Technical Details

### API Functions
```typescript
// Fetch all settings
getSiteSettings(): Promise<SiteSetting[]>

// Fetch settings by category
getSiteSettingsByCategory(category: string): Promise<SiteSetting[]>

// Get single setting
getSiteSetting(key: string): Promise<SiteSetting | null>

// Update single setting
updateSiteSetting(key: string, value: string): Promise<SiteSetting>

// Bulk update
updateMultipleSiteSettings(settings: { key: string; value: string }[]): Promise<SiteSetting[]>
```

### RLS Policies
- **Public**: Can read all settings (for footer display)
- **Admin**: Can read and update all settings

### Performance
- Settings are fetched once on footer mount
- No real-time updates (refresh page to see changes)
- Minimal database queries (single fetch per page load)

## Future Enhancements

Potential improvements:
- Multi-language support for footer content
- Additional social platforms (LinkedIn, TikTok, Pinterest)
- Newsletter signup form in footer
- Footer menu builder for custom links
- Footer background color customization
- Logo upload for footer branding
- Operating hours display
- Multiple contact methods (WhatsApp, Telegram)
- Footer analytics tracking

## Troubleshooting

### Footer Not Showing
- Check if Footer component is imported in App.tsx
- Verify database connection
- Check browser console for errors

### Settings Not Saving
- Verify admin role permissions
- Check RLS policies are enabled
- Ensure all required fields are filled

### Social Icons Not Appearing
- Verify URLs are complete (include https://)
- Check for typos in URL format
- Ensure value is not empty string

### Links Not Working
- Verify page routes exist in routes.tsx
- Check URL format (should start with `/`)
- Test links after saving

## Support

For issues or questions:
- Check database for `site_settings` table
- Verify RLS policies are active
- Review browser console for errors
- Ensure admin role is assigned to user
