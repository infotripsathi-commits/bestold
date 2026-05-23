-- Add image_url column to categories table
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url text;

-- Add display_order column for custom ordering
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS display_order int DEFAULT 0;

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories(display_order);

-- Update RLS policies to allow admins to insert/update/delete categories
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

CREATE POLICY "Admins can insert categories" ON categories
  FOR INSERT TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update categories" ON categories
  FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete categories" ON categories
  FOR DELETE TO authenticated
  USING (is_admin(auth.uid()));