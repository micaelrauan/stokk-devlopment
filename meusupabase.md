-- ============================================================
-- MIGRATION COMPLETA - Projeto Inventário
-- Execute este arquivo no Supabase SQL Editor do projeto externo
-- ============================================================

-- ============================================================
-- 0. Enum e Tipos
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- ============================================================
-- 1. Tabelas
-- ============================================================

CREATE TABLE public.profiles (
id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
company_name text NOT NULL DEFAULT '',
cnpj text DEFAULT '',
address text DEFAULT '',
phone text DEFAULT '',
plan text DEFAULT 'free',
provider text DEFAULT '',
is_active boolean DEFAULT true,
created_at timestamptz DEFAULT now(),
updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
role app_role NOT NULL,
UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.categories (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
name text NOT NULL UNIQUE,
user_id uuid,
created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.colors (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
name text NOT NULL UNIQUE,
hex text NOT NULL DEFAULT '#000000',
user_id uuid,
created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.colors ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.sizes (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
name text NOT NULL,
display_order integer NOT NULL DEFAULT 0,
user_id uuid,
created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sizes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.products (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
name text NOT NULL,
reference text NOT NULL,
category text NOT NULL,
brand text NOT NULL,
description text NOT NULL DEFAULT '',
image_url text NOT NULL DEFAULT '',
cost_price numeric NOT NULL DEFAULT 0,
sale_price numeric NOT NULL DEFAULT 0,
min_stock_threshold integer NOT NULL DEFAULT 3,
user_id uuid,
created_at timestamptz NOT NULL DEFAULT now(),
updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.product_variants (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
size text NOT NULL,
color text NOT NULL,
sku text NOT NULL DEFAULT '',
barcode text NOT NULL DEFAULT '',
current_stock integer NOT NULL DEFAULT 0
);
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.sales (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
customer_name text,
payment_method text NOT NULL DEFAULT 'cash',
subtotal numeric NOT NULL DEFAULT 0,
discount numeric NOT NULL DEFAULT 0,
total numeric NOT NULL DEFAULT 0,
cash_received numeric,
change numeric,
user_id uuid,
created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.sale_items (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
variant_id uuid NOT NULL REFERENCES product_variants(id),
product_id uuid NOT NULL REFERENCES products(id),
product_name text NOT NULL,
variant_label text NOT NULL,
sku text NOT NULL DEFAULT '',
quantity integer NOT NULL DEFAULT 1,
unit_price numeric NOT NULL DEFAULT 0
);
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.inventory_logs (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
product_id uuid NOT NULL REFERENCES products(id),
variant_id uuid NOT NULL REFERENCES product_variants(id),
product_name text NOT NULL,
variant_label text NOT NULL,
type text NOT NULL DEFAULT 'IN',
quantity integer NOT NULL DEFAULT 0,
reason text NOT NULL DEFAULT '',
user_id uuid,
created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.alerts (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
product_id uuid NOT NULL REFERENCES products(id),
product_name text NOT NULL,
reference text NOT NULL DEFAULT '',
type text NOT NULL DEFAULT 'low_stock',
message text NOT NULL,
read boolean NOT NULL DEFAULT false,
user_id uuid,
created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Functions
-- ============================================================

-- Auto-create profile + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
INSERT INTO public.profiles (id) VALUES (NEW.id);
INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
RETURN NEW;
END;

$$
;

-- Security definer for role checks (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS
$$

SELECT EXISTS (
SELECT 1 FROM public.user_roles
WHERE user_id = \_user_id AND role = \_role
)

$$
;

-- ============================================================
-- 3. Trigger
-- ============================================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 4. RLS Policies
-- ============================================================

-- PRODUCTS
CREATE POLICY "Users can view own products" ON products FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own products" ON products FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own products" ON products FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own products" ON products FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- PRODUCT_VARIANTS
CREATE POLICY "Users can view own variants" ON product_variants FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM products WHERE products.id = product_variants.product_id AND products.user_id = auth.uid()));
CREATE POLICY "Users can insert own variants" ON product_variants FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM products WHERE products.id = product_variants.product_id AND products.user_id = auth.uid()));
CREATE POLICY "Users can update own variants" ON product_variants FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM products WHERE products.id = product_variants.product_id AND products.user_id = auth.uid()));
CREATE POLICY "Users can delete own variants" ON product_variants FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM products WHERE products.id = product_variants.product_id AND products.user_id = auth.uid()));

-- CATEGORIES
CREATE POLICY "Users can view own categories" ON categories FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON categories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON categories FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON categories FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- COLORS
CREATE POLICY "Users can view own colors" ON colors FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own colors" ON colors FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own colors" ON colors FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own colors" ON colors FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- SIZES
CREATE POLICY "Users can view own sizes" ON sizes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sizes" ON sizes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sizes" ON sizes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sizes" ON sizes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- SALES
CREATE POLICY "Users can view own sales" ON sales FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sales" ON sales FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sales" ON sales FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sales" ON sales FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- SALE_ITEMS
CREATE POLICY "Users can view own sale items" ON sale_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM sales WHERE sales.id = sale_items.sale_id AND sales.user_id = auth.uid()));
CREATE POLICY "Users can insert own sale items" ON sale_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM sales WHERE sales.id = sale_items.sale_id AND sales.user_id = auth.uid()));
CREATE POLICY "Users can update own sale items" ON sale_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM sales WHERE sales.id = sale_items.sale_id AND sales.user_id = auth.uid()));
CREATE POLICY "Users can delete own sale items" ON sale_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM sales WHERE sales.id = sale_items.sale_id AND sales.user_id = auth.uid()));

-- INVENTORY_LOGS
CREATE POLICY "Users can view own logs" ON inventory_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON inventory_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own logs" ON inventory_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own logs" ON inventory_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ALERTS
CREATE POLICY "Users can view own alerts" ON alerts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own alerts" ON alerts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON alerts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own alerts" ON alerts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- PROFILES
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- USER_ROLES
CREATE POLICY "Users can view own role" ON user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert roles" ON user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 5. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_barcode ON product_variants(barcode);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_variant_id ON sale_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_user_id ON inventory_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(read);
CREATE INDEX IF NOT EXISTS idx_alerts_product_id ON alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_colors_user_id ON colors(user_id);
CREATE INDEX IF NOT EXISTS idx_sizes_user_id ON sizes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- ============================================================
-- 6. Storage
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

CREATE POLICY "Public can view product images" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'product-images');
CREATE POLICY "Authenticated users can upload product images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Users can update own product images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own product images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);


INSERT INTO public.user_roles (user_id, role) VALUES ('fbf242b3-e14d-45a8-8980-40921cefeec1', 'admin');

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

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
AS
$$

SELECT EXISTS (
SELECT 1 FROM public.user_roles
WHERE user_id = auth.uid() AND role = 'admin'
);

$$
;

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
$$
