import { Building2, Package, TrendingUp, Users2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

interface AdminStat {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStat[]>([
    {
      label: "Empresas Ativas",
      value: "...",
      icon: Building2,
      tone: "text-blue-600 bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Empresas Totais",
      value: "...",
      icon: Users2,
      tone: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Produtos no Sistema",
      value: "...",
      icon: Package,
      tone: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    },
  ]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { count: activeCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true);

        const { count: totalCompanies } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        const { count: totalProducts } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true });

        setStats([
          {
            label: "Empresas Ativas",
            value: String(activeCount ?? 0),
            icon: Building2,
            tone: "text-blue-600 bg-blue-500/10 border-blue-500/20",
          },
          {
            label: "Empresas Totais",
            value: String(totalCompanies ?? 0),
            icon: Users2,
            tone: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
          },
          {
            label: "Produtos no Sistema",
            value: String(totalProducts ?? 0),
            icon: Package,
            tone: "text-amber-600 bg-amber-500/10 border-amber-500/20",
          },
        ]);
      } catch (err) {
        console.error("Erro ao carregar estatísticas do admin:", err);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 text-3xl font-heading font-bold tracking-tight">{stat.value}</p>
                  </div>
                  <div className={`rounded-md border p-2 ${stat.tone}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Métricas Detalhadas</CardTitle>
              <CardDescription>
                Gráficos globais de crescimento e faturamento serão adicionados nesta seção.
              </CardDescription>
            </div>
            <Badge variant="outline" className="gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Em breve
            </Badge>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="py-6 text-sm text-muted-foreground">
          Você já pode usar as abas de Empresas e Mensalidades para gestão operacional.
        </CardContent>
      </Card>
    </div>
  );
}
