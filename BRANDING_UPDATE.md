# BestOld Branding Update

## Changes Made

### Application Name
The application has been rebranded from **SecondSwap** to **BestOld**.

### Logo
A new logo component has been created with a shopping bag icon (ShoppingBag from lucide-react).

**Logo Component Location:** `src/components/Logo.tsx`

**Features:**
- Customizable icon and text sizes
- Optional text display (can show icon only)
- Flexible styling with className props
- Primary color accent on the icon

**Usage Example:**
```tsx
import Logo from '@/components/Logo';

// Default usage (with text)
<Logo />

// Icon only
<Logo showText={false} />

// Custom sizes
<Logo 
  iconClassName="h-8 w-8" 
  textClassName="text-2xl font-bold"
/>
```

### Files Updated

1. **src/components/Logo.tsx** (NEW)
   - Created reusable Logo component with ShoppingBag icon
   - Supports customization via props

2. **src/components/layouts/Header.tsx**
   - Replaced hardcoded "SecondSwap" text with Logo component
   - Removed Package2 icon import

3. **src/components/common/PageMeta.tsx**
   - Updated default page title to "BestOld - Buy & Sell Second-Hand Goods"
   - Updated meta description with BestOld branding

4. **src/pages/HomePage.tsx**
   - Added PageMeta component with BestOld branding
   - Updated page description

5. **Documentation Files**
   - CONFIGURATION_GUIDE.md: Updated title to "BestOld Configuration Guide"
   - TODO.md: Updated task title to "Build BestOld"
   - WISHLIST_FOLLOW_FEATURES.md: Replaced all "SecondSwap" references with "BestOld"
   - SELLER_VERIFICATION_FEATURE.md: Replaced all "SecondSwap" references with "BestOld"

### Logo Customization

If you want to change the logo icon, edit `src/components/Logo.tsx`:

```tsx
// Current icon
import { ShoppingBag } from 'lucide-react';

// To change, replace with any lucide-react icon:
import { Store } from 'lucide-react';  // Example alternative
import { Package } from 'lucide-react';  // Example alternative
import { ShoppingCart } from 'lucide-react';  // Example alternative

// Then update the component:
<Store className={`text-primary ${iconClassName}`} />
```

### Available Lucide Icons for Logo

Here are some suitable icon options from lucide-react:
- `ShoppingBag` (current)
- `Store`
- `ShoppingCart`
- `Package`
- `Briefcase`
- `Tag`
- `Gift`
- `Sparkles`
- `TrendingUp`
- `Zap`

### Custom Image Logo

To use a custom image instead of an icon:

1. Place your logo image in `public/` folder (e.g., `public/logo.png`)

2. Update `src/components/Logo.tsx`:

```tsx
interface LogoProps {
  className?: string;
  textClassName?: string;
  showText?: boolean;
}

export default function Logo({ 
  className = '', 
  textClassName = 'text-xl font-bold',
  showText = true 
}: LogoProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <img 
        src="/logo.png" 
        alt="BestOld Logo" 
        className="h-8 w-8 object-contain"
      />
      {showText && (
        <span className={textClassName}>BestOld</span>
      )}
    </div>
  );
}
```

### SEO & Meta Tags

The application now uses consistent branding across all pages:

- **Default Title:** "BestOld - Buy & Sell Second-Hand Goods"
- **Page Titles:** "[Page Name] | BestOld"
- **Meta Description:** "BestOld is your trusted marketplace for buying and selling quality second-hand goods..."

### Browser Tab Title

The browser tab will now display:
- Home page: "Home | BestOld"
- Other pages: "[Page Name] | BestOld"

---

## Quick Reference

| Element | Old Value | New Value |
|---------|-----------|-----------|
| App Name | SecondSwap | BestOld |
| Logo Icon | Package2 | ShoppingBag |
| Logo Component | Inline code | Reusable component |
| Page Title | Not set | BestOld - Buy & Sell Second-Hand Goods |

---

## Testing Checklist

- [x] Logo displays correctly in header
- [x] Logo is clickable and navigates to home page
- [x] Page title shows "BestOld" in browser tab
- [x] All documentation updated with new name
- [x] No references to "SecondSwap" in source code
- [x] Lint passes without errors

---

For further customization or questions, refer to the Logo component at `src/components/Logo.tsx`.
