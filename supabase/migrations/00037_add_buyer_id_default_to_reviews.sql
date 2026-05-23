-- Add default value for buyer_id in reviews table
ALTER TABLE public.reviews 
  ALTER COLUMN buyer_id SET DEFAULT auth.uid();