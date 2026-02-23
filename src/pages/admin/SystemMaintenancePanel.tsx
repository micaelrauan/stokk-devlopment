import { Database, Server, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SystemMaintenancePanel() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-heading font-semibold">Manutenção do Sistema</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ferramentas críticas para operação global
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4" />
              Banco de Dados
            </CardTitle>
            <CardDescription>Ações de limpeza e segurança de dados.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-2">
            <Button variant="destructive" size="sm" className="w-full sm:w-auto">
              Limpar Logs
            </Button>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              Backup
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="h-4 w-4" />
              Infraestrutura
            </CardTitle>
            <CardDescription>Monitoramento e intervenção operacional.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              Reiniciar Sistema
            </Button>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              Status API
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed">
        <CardContent className="p-4 flex items-start gap-3 text-sm text-muted-foreground">
          <ShieldAlert className="h-4 w-4 mt-0.5" />
          Execute operações críticas somente em janelas de manutenção para reduzir impacto aos usuários.
        </CardContent>
      </Card>
    </div>
  );
}
