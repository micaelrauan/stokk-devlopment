import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CompanyPanel() {
  const companies = [
    { name: "Empresa Exemplo 1", plan: "pro" },
    { name: "Empresa Exemplo 2", plan: "free" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading font-semibold">Empresas Cadastradas</h2>
        <Button className="rounded-full px-6">Criar Nova Empresa</Button>
      </div>
      
      <div className="space-y-3">
        {companies.map((company, i) => (
          <div 
            key={i} 
            className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card/30 hover:bg-card/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                {company.name[0]}
              </div>
              <div>
                <p className="font-medium">{company.name}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  company.plan === 'pro' ? 'bg-blue-500/10 text-blue-500' : 'bg-muted text-muted-foreground'
                }`}>
                  {company.plan}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
              Gerenciar
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
