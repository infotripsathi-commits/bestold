# Store Banner Image Feature

## Overview
Added banner image functionality to seller stores, allowing sellers to upload a custom banner image that displays prominently on their store detail page.

## Features Implemented

### 1. Database Schema Enhancement
- Added `banner_image_url` column to stores table
- Stores optional text URL for banner images
- Fully integrated with existing RLS policies

### 2. Store Management Page Enhancement
- **Banner Upload Section**: New upload area at the top of the store form
- **Drag & Drop Interface**: Click to upload banner images
- **Image Preview**: Full-width preview of uploaded banner (4:1 aspect ratio)
- **Remove Button**: Easy removal of banner with confirmation
- **File Validation**: 
  - Maximum file size: 1MB
  - Supported formats: PNG, JPG, WEBP, AVIF
  - Automatic compression if needed
- **Recommended Size**: 1200x300px for optimal display
- **Upload Progress**: Visual feedback during upload
- **Optional Field**: Sellers can create stores without banners

### 3. Store Detail Page Enhancement
- **Hero Banner Display**: Full-width banner at top of page (responsive heights)
  - Mobile: 192px (h-48)
  - Tablet: 256px (h-64)
  - Desktop: 320px (h-80)
- **Gradient Overlay**: Subtle gradient from bottom for better text readability
- **Elevated Store Card**: Store info card overlaps banner with -mt-16 offset
- **Responsive Design**: Banner scales beautifully across all screen sizes
- **Fallback Behavior**: If no banner, page displays normally without empty space

## Technical Implementation

### Database Migration
```sql
-- Add banner_image_url column to stores table
ALTER TABLE stores ADD COLUMN banner_image_url text;

-- Add documentation comment
COMMENT ON COLUMN stores.banner_image_url IS 'URL of the store banner image displayed on store detail page';
```

### TypeScript Interface Update
```typescript
export interface Store {
  id: string;
  seller_id: string;
  name: string;
  description?: string;
  location: string;
  contact_info?: string;
  banner_image_url?: string;  // New field
  average_rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
  seller?: Profile;
}
```

### Image Upload Integration
- Uses existing `uploadProductImage()` function from Supabase Storage
- Reuses product image bucket for consistency
- Automatic compression for files over 1MB
- Secure deletion with `deleteProductImage()` function

## User Experience

### For Sellers
1. **Navigate to Store Management**: Go to seller dashboard → Manage Store
2. **Upload Banner**: 
   - Click the banner upload area at the top of the form
   - Select an image file (max 1MB)
   - See instant preview of uploaded banner
3. **Edit Banner**: Click the X button to remove and upload a new one
4. **Save Store**: Banner is saved along with other store details
5. **View Result**: Visit your store page to see the banner in action

### For Buyers
1. **Browse Stores**: Navigate to any store detail page
2. **Visual Impact**: See the store's banner image at the top
3. **Professional Appearance**: Banners make stores look more established
4. **Better Branding**: Sellers can showcase their brand identity

## Design Specifications

### Banner Dimensions
- **Recommended**: 1200x300px (4:1 aspect ratio)
- **Minimum**: 800x200px
- **Maximum File Size**: 1MB (auto-compressed if larger)

### Display Sizes
- **Mobile (< 768px)**: Full width × 192px height
- **Tablet (768px - 1024px)**: Full width × 256px height
- **Desktop (> 1024px)**: Full width × 320px height

### Visual Effects
- **Gradient Overlay**: `bg-gradient-to-t from-black/60 via-black/20 to-transparent`
- **Object Fit**: `object-cover` ensures banner fills space without distortion
- **Card Elevation**: Store info card overlaps banner by 64px (-mt-16)
- **Border Enhancement**: Elevated card has 2px border for prominence

## Benefits

1. **Brand Identity**: Sellers can establish visual brand presence
2. **Professional Look**: Banners make stores appear more legitimate
3. **Visual Hierarchy**: Clear separation between banner and content
4. **User Engagement**: Eye-catching banners attract buyer attention
5. **Competitive Advantage**: Stores with banners stand out in search results
6. **Flexibility**: Optional feature doesn't force sellers to upload banners
7. **Mobile Optimized**: Responsive design works perfectly on all devices

## Banner Image Ideas for Sellers

### Product Photography
- Showcase best-selling products
- Display product collections
- Highlight seasonal items

### Brand Elements
- Logo and brand colors
- Store name in stylized text
- Brand tagline or motto

### Lifestyle Imagery
- Products in use
- Store ambiance
- Customer testimonials

### Promotional
- Sale announcements
- New arrival highlights
- Special offers

## Future Enhancements (Optional)
- Banner image cropping tool
- Multiple banner images (carousel)
- Seasonal banner scheduling
- Banner templates for sellers
- Analytics on banner click-through rates
- Video banner support
- Animated banner effects
