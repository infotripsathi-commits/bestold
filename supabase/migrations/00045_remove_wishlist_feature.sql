-- Remove all wishlist-related policies from products table
DROP POLICY IF EXISTS "Users can view products in their wishlist" ON products;

-- Remove all wishlist-related policies from stores table
DROP POLICY IF EXISTS "Users can view stores of wishlist products" ON stores;

-- Drop the wishlists table (this will cascade and remove all policies)
DROP TABLE IF EXISTS wishlists CASCADE;