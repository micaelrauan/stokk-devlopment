import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SystemMaintenancePanel() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-heading font-semibold">Manutenção do Sistema</h2>
        <p className="text-sm text-muted-foreground">Ferramentas críticas para operação global</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-border/40 bg-card/30">
          <p className="text-sm font-medium mb-3">Banco de Dados</p>
          <div className="flex gap-2">
            <Button variant="destructive" size="sm">Limpar Logs</Button>
            <Button variant="outline" size="sm">Backup</Button>
          </div>
        </div>
        
        <div className="p-4 rounded-xl border border-border/40 bg-card/30">
          <p className="text-sm font-medium mb-3">Infraestrutura</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Reiniciar Sistema</Button>
            <Button variant="outline" size="sm">Status API</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
