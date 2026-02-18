import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboard() {
  const stats = [
    { label: "Empresas Ativas", value: "12", color: "text-blue-500 bg-blue-500/10" },
    { label: "Usuários Totais", value: "134", color: "text-emerald-500 bg-emerald-500/10" },
    { label: "Logs Recentes", value: "27", color: "text-amber-500 bg-amber-500/10" },
  ];

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
      
      <div className="glass-card rounded-xl p-6 border border-border/40 min-h-[200px] flex items-center justify-center">
        <p className="text-muted-foreground">Gráficos de crescimento em breve...</p>
      </div>
    </div>
  );
}
