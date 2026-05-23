-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('buyer', 'seller', 'admin');

-- Create product condition enum
CREATE TYPE public.product_condition AS ENUM ('new', 'like_new', 'good', 'fair');

-- Create product status enum
CREATE TYPE public.product_status AS ENUM ('active', 'sold', 'removed');

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role public.user_role NOT NULL DEFAULT 'buyer',
  location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create categories table
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create stores table
CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  location text NOT NULL,
  contact_info text,
  average_rating numeric(2,1) DEFAULT 0,
  total_reviews int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(seller_id)
);

-- Create products table
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  condition public.product_condition NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  images text[] DEFAULT '{}',
  status public.product_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id, buyer_id)
);

-- Create conversations table
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(buyer_id, seller_id, store_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_stores_seller_id ON public.stores(seller_id);
CREATE INDEX idx_products_store_id ON public.products(store_id);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_reviews_store_id ON public.reviews(store_id);
CREATE INDEX idx_reviews_buyer_id ON public.reviews(buyer_id);
CREATE INDEX idx_conversations_buyer_id ON public.conversations(buyer_id);
CREATE INDEX idx_conversations_seller_id ON public.conversations(seller_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('app-ahn8efyun8ch_products_images', 'app-ahn8efyun8ch_products_images', true);

-- Storage policies for product images
CREATE POLICY "Public can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'app-ahn8efyun8ch_products_images');

CREATE POLICY "Authenticated sellers can upload product images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'app-ahn8efyun8ch_products_images' AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('seller', 'admin')
  );

CREATE POLICY "Sellers can update their product images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'app-ahn8efyun8ch_products_images' AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('seller', 'admin')
  );

CREATE POLICY "Sellers can delete their product images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'app-ahn8efyun8ch_products_images' AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('seller', 'admin')
  );

-- Create function to sync auth users to profiles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
  user_metadata jsonb;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  user_metadata := NEW.raw_user_meta_data;
  
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(user_metadata->>'full_name', ''),
    CASE 
      WHEN user_count = 0 THEN 'admin'::public.user_role 
      ELSE COALESCE((user_metadata->>'role')::public.user_role, 'buyer'::public.user_role)
    END
  );
  RETURN NEW;
END;
$$;

-- Create trigger to sync users
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

-- Helper function to check if user is seller
CREATE OR REPLACE FUNCTION is_seller(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role IN ('seller'::user_role, 'admin'::user_role)
  );
$$;

-- RLS Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to profiles" ON profiles
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Anyone can view public profiles" ON profiles
  FOR SELECT TO anon USING (true);

-- RLS Policies for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- RLS Policies for stores
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stores" ON stores
  FOR SELECT USING (true);

CREATE POLICY "Sellers can create their own store" ON stores
  FOR INSERT TO authenticated
  WITH CHECK (is_seller(auth.uid()) AND seller_id = auth.uid());

CREATE POLICY "Sellers can update their own store" ON stores
  FOR UPDATE TO authenticated
  USING (seller_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Admins can delete stores" ON stores
  FOR DELETE TO authenticated
  USING (is_admin(auth.uid()));

-- RLS Policies for products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (status = 'active' OR is_admin(auth.uid()) OR store_id IN (SELECT id FROM stores WHERE seller_id = auth.uid()));

CREATE POLICY "Sellers can create products for their store" ON products
  FOR INSERT TO authenticated
  WITH CHECK (
    is_seller(auth.uid()) AND
    store_id IN (SELECT id FROM stores WHERE seller_id = auth.uid())
  );

CREATE POLICY "Sellers can update their own products" ON products
  FOR UPDATE TO authenticated
  USING (
    store_id IN (SELECT id FROM stores WHERE seller_id = auth.uid()) OR
    is_admin(auth.uid())
  );

CREATE POLICY "Sellers can delete their own products" ON products
  FOR DELETE TO authenticated
  USING (
    store_id IN (SELECT id FROM stores WHERE seller_id = auth.uid()) OR
    is_admin(auth.uid())
  );

-- RLS Policies for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Buyers can create reviews" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Buyers can update their own reviews" ON reviews
  FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "Admins can delete reviews" ON reviews
  FOR DELETE TO authenticated
  USING (is_admin(auth.uid()));

-- RLS Policies for conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Buyers can create conversations" ON conversations
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());

-- RLS Policies for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    ) OR is_admin(auth.uid())
  );

CREATE POLICY "Users can send messages in their conversations" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );

-- Function to update store average rating
CREATE OR REPLACE FUNCTION update_store_rating()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE stores
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE store_id = COALESCE(NEW.store_id, OLD.store_id)
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE store_id = COALESCE(NEW.store_id, OLD.store_id)
    )
  WHERE id = COALESCE(NEW.store_id, OLD.store_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to update store rating on review changes
CREATE TRIGGER update_store_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_store_rating();

-- Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- Trigger to update conversation timestamp on new message
CREATE TRIGGER update_conversation_timestamp_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Insert initial categories
INSERT INTO public.categories (name) VALUES
  ('Electronics'),
  ('Clothing'),
  ('Furniture'),
  ('Books'),
  ('Sports & Outdoors'),
  ('Home & Garden'),
  ('Toys & Games'),
  ('Automotive'),
  ('Musical Instruments'),
  ('Other');