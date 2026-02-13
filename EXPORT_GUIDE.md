# 📦 Guia de Exportação — Lovable → VS Code + Supabase

## 1. Pré-requisitos

- **Node.js** ≥ 18.x (recomendado: 20 LTS)
- **Bun** ≥ 1.x (gerenciador de pacotes usado no projeto) ou **npm/yarn**
- **Git**
- Conta no [Supabase](https://supabase.com) com um projeto criado
- (Opcional) [Supabase CLI](https://supabase.com/docs/guides/cli) para gerenciar edge functions

---

## 2. Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | React 18.3 |
| Bundler | Vite 5.x |
| Linguagem | TypeScript |
| Estilos | Tailwind CSS + shadcn/ui (Radix UI) |
| State/Cache | TanStack React Query 5 |
| Roteamento | React Router DOM 6 |
| Gráficos | Recharts 2 |
| Ícones | Lucide React |
| Backend | Supabase (Auth, Database, Storage, Edge Functions) |

---

## 3. Dependências Principais

```json
{
  "@supabase/supabase-js": "^2.95.3",
  "@tanstack/react-query": "^5.83.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.30.1",
  "recharts": "^2.15.4",
  "lucide-react": "^0.462.0",
  "sonner": "^1.7.4",
  "jsbarcode": "^3.12.3",
  "html5-qrcode": "^2.3.8",
  "date-fns": "^3.6.0",
  "zod": "^3.25.76",
  "react-hook-form": "^7.61.1",
  "@hookform/resolvers": "^3.10.0"
}
```

---

## 4. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_anon_key_aqui
VITE_SUPABASE_PROJECT_ID=seu_project_id_aqui
```

### Edge Functions (configurar como Secrets no Supabase Dashboard):
- `SUPABASE_URL` — URL do projeto (automático)
- `SUPABASE_ANON_KEY` — Chave anon (automático)
- `SUPABASE_SERVICE_ROLE_KEY` — Chave service_role (automático)

---

## 5. Configuração do Banco de Dados

### 5.1 Executar Migration

1. Acesse o **SQL Editor** do Supabase Dashboard
2. Cole e execute o conteúdo do arquivo `migration.sql`
3. Isso criará: tabelas, RLS policies, indexes, functions, trigger e storage bucket

### 5.2 Schema das Tabelas

| Tabela | Descrição | Isolamento |
|--------|-----------|-----------|
| `profiles` | Perfil da empresa (auto-criado no signup) | `id = auth.uid()` |
| `user_roles` | Roles do usuário (admin/user) | `user_id` |
| `products` | Produtos cadastrados | `user_id` |
| `product_variants` | Variantes (cor/tamanho/SKU/barcode) | via `product_id → products.user_id` |
| `categories` | Categorias de produto | `user_id` |
| `colors` | Cores disponíveis | `user_id` |
| `sizes` | Tamanhos disponíveis | `user_id` |
| `sales` | Vendas registradas | `user_id` |
| `sale_items` | Itens de cada venda | via `sale_id → sales.user_id` |
| `inventory_logs` | Movimentações de estoque | `user_id` |
| `alerts` | Alertas de estoque baixo | `user_id` |

### 5.3 Automações

- **Trigger `on_auth_user_created`**: Ao criar um usuário no Auth, automaticamente insere registro em `profiles` e atribui role `user` em `user_roles`.
- **Function `has_role()`**: Verifica roles sem causar recursão RLS (SECURITY DEFINER).

---

## 6. Autenticação

- **Método**: Email/Senha via Supabase Auth
- **Roles**: `admin` e `user` (enum `app_role`)
- **Fluxo**: Signup → trigger cria profile + role → Login → App verifica role via `user_roles`
- **Configuração**: No Supabase Dashboard → Authentication → Settings:
  - ✅ Enable Email provider
  - ❌ Disable "Confirm email" apenas se desejar auto-confirm (não recomendado para produção)

---

## 7. Storage

- **Bucket**: `product-images` (público para leitura)
- **Policies**:
  - Leitura: pública
  - Upload: usuários autenticados
  - Update/Delete: apenas o dono (baseado no folder path `user_id/`)

---

## 8. Edge Functions

### `admin-update-user`

Localização: `supabase/functions/admin-update-user/index.ts`

**Deploy via Supabase CLI:**
```bash
supabase functions deploy admin-update-user --project-ref SEU_PROJECT_ID
```

**Funcionalidades:**
- `GET ?action=list` — Lista todos os usuários (admin only)
- `POST ?action=update` — Atualiza email/senha de um usuário (admin only)

---

## 9. Rotas da Aplicação

| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/` | Público | Landing page |
| `/login` | Público | Login/Registro |
| `/dashboard` | Autenticado | Dashboard com métricas |
| `/produtos` | Autenticado | CRUD de produtos |
| `/vendas` | Autenticado | PDV (Ponto de Venda) |
| `/historico` | Autenticado | Histórico de vendas |
| `/estoque` | Autenticado | Movimentações de estoque |
| `/operacoes` | Autenticado | Operações de inventário |
| `/etiquetas` | Autenticado | Geração de etiquetas/barcode |
| `/leitor` | Autenticado | Leitor de barcode/QR |
| `/avisos` | Autenticado | Alertas de estoque baixo |
| `/admin` | Admin | Painel administrativo |
| `/admin/usuarios` | Admin | Gerenciamento de usuários |
| `/admin/planos` | Admin | Gerenciamento de planos |
| `/admin/atividade` | Admin | Log de atividades |

---

## 10. Estrutura de Pastas

```
├── public/                     # Assets estáticos
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── assets/                 # Imagens importadas via ES6
│   ├── components/             # Componentes reutilizáveis
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── AddProductDialog.tsx
│   │   ├── EditProductDialog.tsx
│   │   ├── AppLayout.tsx
│   │   ├── ProductGrid.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/               # React Contexts
│   │   ├── AuthContext.tsx      # Autenticação + roles
│   │   └── InventoryContext.tsx # Estado do inventário
│   ├── hooks/                  # Custom hooks
│   │   └── useInventory.ts
│   ├── integrations/supabase/  # Cliente Supabase (auto-gerado)
│   │   ├── client.ts
│   │   └── types.ts
│   ├── pages/                  # Páginas/rotas
│   │   ├── admin/              # Páginas admin
│   │   ├── DashboardPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── SalesPage.tsx
│   │   └── ...
│   ├── types/                  # TypeScript types
│   ├── App.tsx                 # Router principal
│   ├── main.tsx                # Entry point
│   └── index.css               # Tailwind + design tokens
├── supabase/
│   ├── config.toml             # Config do Supabase
│   └── functions/
│       └── admin-update-user/  # Edge function
├── migration.sql               # SQL completo do banco
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 11. Setup Local (VS Code)

```bash
# 1. Clone o repositório
git clone <repo-url>
cd <projeto>

# 2. Instale dependências
bun install
# ou: npm install

# 3. Configure o .env
cp .env.example .env
# Edite com suas credenciais do Supabase

# 4. Execute o banco de dados
# Cole migration.sql no SQL Editor do Supabase

# 5. Deploy edge functions (com Supabase CLI)
supabase login
supabase link --project-ref SEU_PROJECT_ID
supabase functions deploy admin-update-user

# 6. Inicie o dev server
bun dev
# ou: npm run dev

# Acesse http://localhost:8080
```

---

## 12. Checklist Pós-Exportação

- [ ] Projeto Supabase criado no dashboard
- [ ] `migration.sql` executado no SQL Editor
- [ ] Variáveis de ambiente configuradas no `.env`
- [ ] Bucket `product-images` criado (incluído na migration)
- [ ] Edge function `admin-update-user` deployada
- [ ] Testar signup → verificar profile + role criados automaticamente
- [ ] Testar login → verificar acesso às rotas protegidas
- [ ] Testar CRUD de produtos → verificar isolamento por user_id
- [ ] Testar upload de imagem → verificar no Storage
- [ ] Testar vendas → verificar desconto de estoque
- [ ] Verificar que Usuário A não vê dados do Usuário B
- [ ] (Opcional) Configurar domínio customizado
- [ ] (Opcional) Configurar SMTP para emails de confirmação

---

## 13. ⚠️ Avisos Importantes

1. **O arquivo `src/integrations/supabase/client.ts`** precisa ser atualizado com a URL e anon key do novo projeto Supabase. No Lovable ele é auto-gerado; no VS Code, edite manualmente.

2. **O arquivo `src/integrations/supabase/types.ts`** é gerado pelo Supabase CLI com `supabase gen types typescript`. Execute após rodar a migration para manter os tipos sincronizados.

3. **As RLS policies da migration são seguras** (`auth.uid() = user_id`), diferente das policies abertas que existiam no Lovable.

4. **Storage**: para que o update/delete de imagens funcione por owner, as imagens devem ser uploadadas em subpastas com o `user_id` como prefixo (ex: `user_id/image.jpg`).

5. **Não existe Realtime** configurado neste projeto. Se precisar, adicione via `ALTER PUBLICATION supabase_realtime ADD TABLE nome_da_tabela;`.

6. **Não existem cron jobs** ou processamentos em background.
