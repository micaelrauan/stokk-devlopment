-- ============================================================
-- SECURITY MIGRATION — Multi-tenancy + Storage + RLS hardening
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- #1: Fix UNIQUE constraints to be tenant-scoped (not global)
-- Drop global unique and add per-user unique
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_name_key;
ALTER TABLE public.categories ADD CONSTRAINT categories_name_user_unique UNIQUE (user_id, name);

ALTER TABLE public.colors DROP CONSTRAINT IF EXISTS colors_name_key;
ALTER TABLE public.colors ADD CONSTRAINT colors_name_user_unique UNIQUE (user_id, name);

-- #2: Add CHECK constraints for data integrity
ALTER TABLE public.products
  ADD CONSTRAINT products_sale_price_positive CHECK (sale_price >= 0),
  ADD CONSTRAINT products_cost_price_positive CHECK (cost_price >= 0),
  ADD CONSTRAINT products_min_stock_positive CHECK (min_stock_threshold >= 0);

ALTER TABLE public.product_variants
  ADD CONSTRAINT variants_stock_non_negative CHECK (current_stock >= 0);

ALTER TABLE public.sales
  ADD CONSTRAINT sales_total_non_negative CHECK (total >= 0);

ALTER TABLE public.sale_items
  ADD CONSTRAINT sale_items_quantity_positive CHECK (quantity > 0),
  ADD CONSTRAINT sale_items_price_non_negative CHECK (unit_price >= 0);

-- #3: Add is_active check to RLS policies (blocked accounts)
-- Products
DROP POLICY IF EXISTS "Users can view own products" ON products;
CREATE POLICY "Users can view own products" ON products FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true)
  );

DROP POLICY IF EXISTS "Users can insert own products" ON products;
CREATE POLICY "Users can insert own products" ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true)
  );

DROP POLICY IF EXISTS "Users can update own products" ON products;
CREATE POLICY "Users can update own products" ON products FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true))
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own products" ON products;
CREATE POLICY "Users can delete own products" ON products FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true));

-- Sales
DROP POLICY IF EXISTS "Users can view own sales" ON sales;
CREATE POLICY "Users can view own sales" ON sales FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true));

DROP POLICY IF EXISTS "Users can insert own sales" ON sales;
CREATE POLICY "Users can insert own sales" ON sales FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true));

-- Inventory logs
DROP POLICY IF EXISTS "Users can view own logs" ON inventory_logs;
CREATE POLICY "Users can view own logs" ON inventory_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true));

DROP POLICY IF EXISTS "Users can insert own logs" ON inventory_logs;
CREATE POLICY "Users can insert own logs" ON inventory_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true));

-- #4: Fix storage upload policy to require user-scoped paths
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Users upload in own folder" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Fix delete policy to match upload path structure
DROP POLICY IF EXISTS "Users can delete own product images" ON storage.objects;
CREATE POLICY "Users can delete own product images" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Fix update policy
DROP POLICY IF EXISTS "Users can update own product images" ON storage.objects;
CREATE POLICY "Users can update own product images" ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- #5: Restrict max file size in storage (2MB limit)
UPDATE storage.buckets
SET file_size_limit = 2097152,           -- 2MB max per file
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
WHERE id = 'product-images';

-- #6: Admin RLS policies (read-only cross-tenant access for admins)
-- Only give admins SELECT access, never INSERT/UPDATE/DELETE on other tenants' data
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Admin can view all products (read-only for dashboard)
DROP POLICY IF EXISTS "Admins can view all products" ON products;
CREATE POLICY "Admins can view all products" ON products FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admin can view all sales (read-only for dashboard)
DROP POLICY IF EXISTS "Admins can view all sales" ON sales;
CREATE POLICY "Admins can view all sales" ON sales FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admin can view all logs (read-only for dashboard)
DROP POLICY IF EXISTS "Admins can view all logs" ON inventory_logs;
CREATE POLICY "Admins can view all logs" ON inventory_logs FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admin can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admin can update profiles (toggle active, change plan, etc.)
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
