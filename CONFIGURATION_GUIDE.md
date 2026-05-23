# BestOld Configuration Guide

## 📍 How to Update Locations

### Location File
All available locations are defined in: **`src/lib/locations.ts`**

### Current Locations
The system currently includes 26 major US cities. To modify:

1. Open `src/lib/locations.ts`
2. Edit the `LOCATIONS` array
3. Each location has two properties:
   - `value`: URL-friendly identifier (lowercase, hyphenated)
   - `label`: Display name shown to users

### Example: Adding New Locations
```typescript
export const LOCATIONS = [
  { value: 'new-york-ny', label: 'New York, NY' },
  { value: 'los-angeles-ca', label: 'Los Angeles, CA' },
  // Add your new locations here:
  { value: 'orlando-fl', label: 'Orlando, FL' },
  { value: 'tampa-fl', label: 'Tampa, FL' },
  // ... more locations
];
```

### Where Locations Are Used
- **User Registration**: Users select their location during signup
- **Store Creation**: Sellers specify store location
- **Search Filters**: Buyers filter products/stores by location
- **Account Settings**: Users can update their location in Account page

---

## 🗂️ Subcategories Feature

### Overview
The subcategories feature allows you to organize products in a hierarchical structure:
- **Category** (e.g., Electronics)
  - **Subcategory** (e.g., Smartphones, Laptops, Tablets)

### Admin Management

#### Accessing Subcategory Management
1. Log in as admin
2. Navigate to **Admin Panel → Categories**
3. You'll see all categories displayed as cards
4. Each card shows the number of subcategories

#### Creating Subcategories
1. Click the **"Subs"** button on any category card
2. The subcategory management section will appear below
3. Click **"Add Subcategory"**
4. Fill in:
   - **Subcategory Name**: e.g., "Smartphones", "Laptops"
   - **Display Order**: Lower numbers appear first (0, 1, 2, etc.)
5. Click **"Create"**

#### Editing Subcategories
1. In the subcategory management section, click **"Edit"** on any subcategory
2. Update the name or display order
3. Click **"Update"**

#### Deleting Subcategories
1. Click the trash icon on any subcategory
2. Confirm deletion
3. Products in this subcategory will have their subcategory unset (but remain in the parent category)

### Database Structure
```sql
-- Categories table (existing)
categories
  - id (uuid)
  - name (text)
  - image_url (text)
  - display_order (integer)

-- Subcategories table (new)
subcategories
  - id (uuid)
  - category_id (uuid) → references categories
  - name (text)
  - display_order (integer)

-- Products table (updated)
products
  - category_id (uuid) → references categories
  - subcategory_id (uuid) → references subcategories
```

### Using Subcategories in Product Creation
When sellers create or edit products, they can now:
1. Select a **Category** (required)
2. Select a **Subcategory** (optional, filtered by selected category)

This provides better organization and more precise search/filtering capabilities.

---

## 🔧 Other Configuration Options

### Phone Number Field
- **Location**: `src/pages/auth/RegisterPage.tsx`
- **Database**: `profiles.phone_number` column
- Phone numbers are mandatory during registration
- Cannot be changed after registration (displayed as read-only in Account page)

### Store Approval System
- **Admin Page**: `src/pages/admin/AdminStoreApprovalsPage.tsx`
- Stores require admin approval before going live
- Approval statuses: `pending`, `approved`, `rejected`

### Category Images
- **Predefined Images**: `src/lib/category-images.ts`
- **Custom Upload**: Admin can upload custom images via the Categories page
- Images are stored in Supabase Storage bucket: `product-images`

---

## 📝 Quick Reference

| Feature | File Location | Purpose |
|---------|--------------|---------|
| Locations | `src/lib/locations.ts` | Define available cities/regions |
| Categories | Admin Panel → Categories | Manage product categories |
| Subcategories | Admin Panel → Categories → Subs button | Manage subcategories under each category |
| Phone Number | `src/pages/auth/RegisterPage.tsx` | Mandatory user contact field |
| Store Approval | Admin Panel → Approvals | Review and approve seller stores |

---

## 🚀 Next Steps

1. **Update Locations**: Edit `src/lib/locations.ts` to match your target regions
2. **Create Categories**: Add main product categories via Admin Panel
3. **Add Subcategories**: Organize each category with relevant subcategories
4. **Test Flow**: Create a test seller account and list products with categories/subcategories
5. **Verify Search**: Ensure filtering by category and subcategory works correctly

---

## 💡 Tips

- **Display Order**: Use increments of 10 (0, 10, 20, 30) to leave room for future insertions
- **Naming**: Keep category/subcategory names short and clear
- **Images**: Use high-quality, relevant images for categories (recommended: 800x600px)
- **Locations**: Order locations alphabetically or by popularity for better UX
- **Subcategories**: Don't create too many subcategories (5-10 per category is ideal)

---

For technical support or questions, refer to the main README.md or contact the development team.
