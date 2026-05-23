-- Add business_type column to stores table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stores' AND column_name = 'business_type'
  ) THEN
    -- Create enum type for business_type
    CREATE TYPE business_type_enum AS ENUM ('retail', 'wholesale', 'both');
    
    -- Add business_type column with default value
    ALTER TABLE stores 
    ADD COLUMN business_type business_type_enum NOT NULL DEFAULT 'retail';
    
    -- Create index for filtering by business type
    CREATE INDEX idx_stores_business_type ON stores(business_type);
  END IF;
END $$;