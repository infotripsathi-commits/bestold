-- Add pending_approval status to product_status enum
ALTER TYPE product_status ADD VALUE IF NOT EXISTS 'pending_approval';

-- Add approval tracking columns
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS approved_at timestamptz,
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Create index for faster queries on pending products
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status) WHERE status = 'pending_approval';

-- Update existing products to be approved (backward compatibility)
UPDATE products 
SET status = 'active', approved_at = created_at 
WHERE status = 'active' AND approved_at IS NULL;

COMMENT ON COLUMN products.approved_at IS 'Timestamp when product was approved by admin';
COMMENT ON COLUMN products.approved_by IS 'Admin user who approved the product';
COMMENT ON COLUMN products.rejection_reason IS 'Reason provided by admin for rejection';
