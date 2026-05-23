# Admin Product Approvals Fix

## Issue
Store owners were adding products, but they were not showing up in the Admin Product Approvals page. The error message showed: "column stores_1.owner_id does not exist"

## Root Causes

### 1. RLS Policy Issue (Fixed in v488)
The Row Level Security (RLS) policies for the `products` and `stores` tables were using direct `EXISTS` subqueries instead of calling the `is_admin()` security definer function.

### 2. Column Name Mismatch (Fixed in v489)
The `getPendingProducts()` function was trying to select `owner_id` from the stores table, but the actual column name is `seller_id`.

## Solutions Applied

### Fix 1: Updated RLS Policies
Changed both policies to use the `is_admin()` security definer function:

**Products table:**
```sql
CREATE POLICY "Admins can view all products"
ON products FOR SELECT TO authenticated
USING (is_admin(auth.uid()));
```

**Stores table:**
```sql
CREATE POLICY "Admins can view all stores"
ON stores FOR SELECT TO authenticated
USING (is_admin(auth.uid()));
```

### Fix 2: Corrected Column Name
Updated the query in `getPendingProducts()` function:

**Before:**
```typescript
store:stores(id, name, owner_id, is_franchise)
```

**After:**
```typescript
store:stores(id, name, seller_id, is_franchise)
```

Also updated the TypeScript interface in `AdminProductApprovalsPage.tsx` to use `seller_id` instead of `owner_id`.

## Files Modified
1. `/workspace/app-ahn8efyun8ch/src/db/api.ts` - Fixed getPendingProducts query
2. `/workspace/app-ahn8efyun8ch/src/pages/admin/AdminProductApprovalsPage.tsx` - Updated interface

## Database Migrations Applied
1. `fix_admin_products_view_policy` - Fixed the products table RLS policy
2. `fix_admin_stores_view_policy` - Fixed the stores table RLS policy

## Verification
- 5+ pending products verified in database
- Query now uses correct column name `seller_id`
- Admin panel should now display pending products without errors
- Admins can approve or reject products successfully
