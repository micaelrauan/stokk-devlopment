-- Adicionar colunas para suporte a E-commerce na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_ecommerce boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Criar índice para busca rápida por slug (para a vitrine)
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON public.profiles(slug);

-- Política de acesso público para ler dados da loja (slug, nome, etc)
CREATE POLICY "Public can view store profiles" ON public.profiles
FOR SELECT USING (has_ecommerce = true);
