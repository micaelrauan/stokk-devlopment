import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, Users } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const from = (table: string) => (supabase as any).from(table);

const plans = [
  {
    name: "Grátis",
    key: "free",
    price: "R$ 0",
    features: [
      "Até 50 produtos",
      "Até 100 vendas/mês",
      "1 usuário",
      "Dashboard básico",
      "Alertas de estoque baixo",
    ],
  },
  {
    name: "Stokk Pro",
    key: "pro",
    price: "R$ 89/mês",
    features: [
      "Produtos ilimitados",
      "Vendas ilimitadas",
      "Usuários ilimitados",
      "Relatórios + exportação",
      "Etiquetas em lote",
      "Leitor de código de barras",
      "Gestão multi-loja",
      "Suporte VIP WhatsApp",
    ],
  },
];

export default function AdminPlans() {
  const [planCounts, setPlanCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const load = async () => {
      const [profilesRes, rolesRes] = await Promise.all([
        from("profiles").select("plan"),
        from("user_roles").select("user_id, role"),
      ]);
      if (!profilesRes.data) return;
      const adminIds = new Set(
        (rolesRes.data ?? [])
          .filter((r: any) => r.role === "admin")
          .map((r: any) => r.user_id),
      );
      const users = profilesRes.data.filter((p: any) => !adminIds.has(p.id));
      const counts: Record<string, number> = {};
      users.forEach((u: any) => {
        const plan = u.plan || "free";
        counts[plan] = (counts[plan] || 0) + 1;
      });
      setPlanCounts(counts);
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold">Planos</h1>
        <p className="text-muted-foreground mt-1">
          Configure os planos disponíveis
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        {plans.map((plan) => (
          <div
            key={plan.key}
            className={`glass-card rounded-xl p-6 ${plan.key === "pro" ? "ring-2 ring-warning" : ""}`}
          >
            <h3 className="font-heading font-bold text-lg">{plan.name}</h3>
            <p className="text-2xl font-heading font-bold mt-2">{plan.price}</p>
            <div className="flex items-center gap-1 mt-2 text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span className="text-sm">
                {planCounts[plan.key] ?? 0} empresas
              </span>
            </div>
            <ul className="mt-4 space-y-2">
              {plan.features.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <ChevronRight className="w-3 h-3 text-success" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
