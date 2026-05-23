-- Add soft delete support to products table

-- Add deleted_at column
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at) WHERE deleted_at IS NULL;

-- Update existing queries to exclude deleted products by default
-- This is handled in application code

-- Comments
COMMENT ON COLUMN products.deleted_at IS 'Timestamp when product was soft deleted. NULL means product is active.';
