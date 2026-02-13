import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const from = (table: string) => (supabase as any).from(table);

interface RecentUser {
  id: string;
  company_name: string;
  cnpj: string;
  plan: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, activeUsers: 0, products: 0, sales: 0, revenue: 0 });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);

  useEffect(() => {
    const load = async () => {
      const [profilesRes, rolesRes, productsRes, salesRes] = await Promise.all([
        from('profiles').select('*'),
        from('user_roles').select('user_id, role'),
        from('products').select('id', { count: 'exact', head: true }),
        from('sales').select('total'),
      ]);
      const adminIds = new Set((rolesRes.data ?? []).filter((r: any) => r.role === 'admin').map((r: any) => r.user_id));
      const users = (profilesRes.data ?? []).filter((p: any) => !adminIds.has(p.id));
      const activeUsers = users.filter((u: any) => u.is_active);
      setStats({
        users: users.length,
        activeUsers: activeUsers.length,
        products: productsRes.count ?? 0,
        sales: (salesRes.data ?? []).length,
        revenue: (salesRes.data ?? []).reduce((s: number, r: any) => s + Number(r.total), 0),
      });
      setRecentUsers(users.slice(0, 5).map((p: any) => ({
        id: p.id,
        company_name: p.company_name,
        cnpj: p.cnpj,
        plan: p.plan,
        is_active: p.is_active,
        created_at: p.created_at,
      })));
    };
    load();
  }, []);

  const cards = [
    { label: 'Empresas', value: stats.users, color: 'text-primary' },
    { label: 'Ativas', value: stats.activeUsers, color: 'text-success' },
    { label: 'Produtos (total)', value: stats.products, color: 'text-info' },
    { label: 'Vendas (total)', value: stats.sales, color: 'text-warning' },
    { label: 'Receita (total)', value: `R$ ${stats.revenue.toFixed(2)}`, color: 'text-accent-foreground' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold">Painel Administrativo</h1>
        <p className="text-muted-foreground mt-1">Visão geral do sistema</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map(c => (
          <div key={c.label} className="glass-card rounded-xl p-5">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className={`text-2xl font-heading font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>
      <div className="glass-card rounded-xl p-6">
        <h2 className="font-heading font-semibold text-lg mb-4">Empresas Recentes</h2>
        {recentUsers.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma empresa cadastrada ainda.</p>
        ) : (
          <div className="space-y-3">
            {recentUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="font-medium text-sm">{u.company_name || 'Sem nome'}</p>
                  <p className="text-xs text-muted-foreground">{u.cnpj || 'CNPJ não informado'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${u.is_active ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                    {u.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${u.plan === 'premium' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}`}>
                    {u.plan || 'free'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
