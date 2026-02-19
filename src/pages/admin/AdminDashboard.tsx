import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function AdminDashboard() {
  const [stats, setStats] = useState([
    { label: "Empresas Ativas", value: "...", color: "text-blue-500 bg-blue-500/10" },
    { label: "Empresas Totais", value: "...", color: "text-emerald-500 bg-emerald-500/10" },
    { label: "Produtos Totais", value: "...", color: "text-amber-500 bg-amber-500/10" },
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
            value: (activeCount ?? 0).toString(), 
            color: "text-blue-500 bg-blue-500/10" 
          },
          { 
            label: "Empresas Totais", 
            value: (totalCompanies ?? 0).toString(), 
            color: "text-emerald-500 bg-emerald-500/10" 
          },
          { 
            label: "Produtos em Sistema", 
            value: (totalProducts ?? 0).toString(), 
            color: "text-amber-500 bg-amber-500/10" 
          },
        ]);
      } catch (err) {
        console.error("Erro ao carregar estatísticas do admin:", err);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s) => (
          <div key={s.label} className="glass-card rounded-xl p-6 border border-border/40">
            <p className="text-sm text-muted-foreground font-medium">{s.label}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-heading font-bold">{s.value}</span>
              <span className={`w-2 h-2 rounded-full ${s.color.split(' ')[1]}`}></span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="glass-card rounded-xl p-6 border border-border/40 min-h-[200px] flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-foreground font-semibold">Métricas Detalhadas</p>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          Em breve você poderá visualizar gráficos de crescimento e faturamento global.
        </p>
      </div>
    </div>
  );
}
