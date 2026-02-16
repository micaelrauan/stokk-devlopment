-- ============================================================
-- PERMISSÕES PÚBLICAS PARA VITRINE DE E-COMMERCE
-- Execute este script para permitir que visitantes vejam os produtos
-- ============================================================

-- 1. Produtos: Permitir leitura se o dono da loja tiver ecommerce ativo
DROP POLICY IF EXISTS "Public view products" ON products;
CREATE POLICY "Public view products" ON products FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = products.user_id
        AND profiles.has_ecommerce = true
    )
);

-- 2. Variantes: Permitir leitura pública (simplificado para performance)
DROP POLICY IF EXISTS "Public view variants" ON product_variants;
CREATE POLICY "Public view variants" ON product_variants FOR SELECT USING (true);

-- 3. Tabelas Auxiliares: Leitura pública irrestrita (não contém dados sensíveis)
DROP POLICY IF EXISTS "Public view categories" ON categories;
CREATE POLICY "Public view categories" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public view colors" ON colors;
CREATE POLICY "Public view colors" ON colors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public view sizes" ON sizes;
CREATE POLICY "Public view sizes" ON sizes FOR SELECT USING (true);

-- 4. Storage: Permitir ver imagens dos produtos publicamente (já existia, mas reforçando)
-- Nota: A política padrão do bucket 'product-images' geralmente já é pública para SELECT.
