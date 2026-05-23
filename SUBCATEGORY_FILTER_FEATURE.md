# Subcategory Filter Feature

## Overview
Added subcategory filtering to the search page, allowing users to filter products by specific subcategories in addition to main categories.

## Problem
The category filter dropdown on the All Stores/Search page was only showing main categories (e.g., "Mobile & Tablet", "Electronics & Appliances"). Users could not filter by subcategories (e.g., "Mobiles", "Tablets", "Feature Phones"), which limited their ability to find specific types of products.

## Solution
Implemented a hierarchical category filter that displays subcategories indented under their parent categories in the dropdown menu.

## Features Implemented

### 1. Database Structure
The application already had a proper category-subcategory structure:
- **categories** table: Main categories
- **subcategories** table: Subcategories with `category_id` foreign key
- **products** table: Has both `category_id` and `subcategory_id` columns

### 2. API Updates
Created new API function to fetch categories with their subcategories:
```typescript
getCategoriesWithSubcategories()
```
- Returns categories with nested subcategories array
- Subcategories sorted by display_order
- Maintains backward compatibility with existing getCategories()

### 3. Type Definitions
Added new TypeScript types:
```typescript
interface CategoryWithSubcategories extends Category {
  subcategories?: Subcategory[];
}

interface SearchFilters {
  // ... existing fields
  subcategory_id?: string;  // New field
}
```

### 4. Search Functionality
Updated `searchProducts()` function to support subcategory filtering:
- If `subcategory_id` is provided, filter by subcategory
- If only `category_id` is provided, filter by category
- Maintains backward compatibility with existing searches

### 5. UI Implementation
Updated SearchPage category dropdown:
- Main categories displayed normally
- Subcategories displayed indented (pl-8 class) under their parent category
- Subcategory values prefixed with 'sub_' to differentiate from categories
- Example structure:
  ```
  All Categories
  Mobile & Tablet
    Tablet & ipad
    Mobiles
    Feature Phones
    Phone Accessories
  Electronics & Appliances
    Smartphones
    Laptops
    Tablets
    Cameras
    Audio & Headphones
  ```

## Technical Implementation

### Value Encoding
To differentiate between category and subcategory selections:
- **Category**: Value is the category ID (e.g., "abc123")
- **Subcategory**: Value is prefixed with "sub_" (e.g., "sub_xyz789")

### Search Logic
```typescript
const isSubcategory = categoryOrSubcategory?.startsWith('sub_') ?? false;
const filters = {
  category_id: isSubcategory ? undefined : categoryOrSubcategory,
  subcategory_id: isSubcategory ? categoryOrSubcategory.replace('sub_', '') : undefined,
};
```

## Files Modified

### Created:
None (used existing database structure)

### Modified:
1. `/src/types/types.ts`
   - Added `CategoryWithSubcategories` interface
   - Added `subcategory_id` to `SearchFilters`

2. `/src/db/api.ts`
   - Created `getCategoriesWithSubcategories()` function
   - Updated `searchProducts()` to support subcategory filtering

3. `/src/pages/SearchPage.tsx`
   - Updated to use `getCategoriesWithSubcategories()`
   - Modified category dropdown to display subcategories
   - Updated `performSearch()` to handle subcategory selection

## Example Subcategories

### Mobile & Tablet
- Tablet & ipad
- Mobiles
- Feature Phones
- Phone Accessories

### Electronics & Appliances
- Smartphones
- Laptops
- Tablets
- Cameras
- Audio & Headphones

### Fashion
- Men's Clothing
- Women's Clothing
- Kids' Clothing
- Shoes
- Accessories

### Furniture
- Living Room
- Bedroom
- Office
- Outdoor

### Bikes
- bikes
- scooty

## Testing Results
- ✅ Lint check passed: 203 files, 0 errors
- ✅ Database query verified: Subcategories properly linked to categories
- ✅ TypeScript compilation successful
- ✅ Backward compatibility maintained: Category-only filtering still works

## Benefits
1. **Better User Experience**: Users can find specific product types more easily
2. **More Precise Filtering**: Narrow down search results to exact subcategories
3. **Improved Navigation**: Clear hierarchical structure in dropdown
4. **Backward Compatible**: Existing category filtering continues to work
5. **Scalable**: Easy to add more subcategories in the future

## Usage
1. Navigate to the Search page or All Stores page
2. Click on the Category filter dropdown
3. Select a main category to see all products in that category
4. OR select a subcategory (indented) to see only products in that specific subcategory
5. Search results update immediately
