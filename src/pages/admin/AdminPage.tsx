import {
  Building2,
  CreditCard,
  LayoutDashboard,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AdminBillingPanel from "./AdminBillingPanel";
import AdminDashboard from "./AdminDashboard";
import CompanyPanel from "./CompanyPanel";
import SystemMaintenancePanel from "./SystemMaintenancePanel";

type AdminSection = "dashboard" | "companies" | "billings" | "maintenance";

const SECTIONS: {
  label: string;
  value: AdminSection;
  icon: any;
}[] = [
  { label: "Dashboard", value: "dashboard", icon: LayoutDashboard },
  { label: "Empresas", value: "companies", icon: Building2 },
  { label: "Mensalidades", value: "billings", icon: CreditCard },
  { label: "Manutenção", value: "maintenance", icon: Settings },
];

export default function AdminPage() {
  const [section, setSection] = useState<AdminSection>("dashboard");

  const content = useMemo(() => {
    if (section === "dashboard") return <AdminDashboard />;
    if (section === "companies") return <CompanyPanel />;
    if (section === "billings") return <AdminBillingPanel />;
    return <SystemMaintenancePanel />;
  }, [section]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">
                Painel Administrativo
              </h1>
              <p className="text-muted-foreground mt-1">Gestão global do sistema Stokk</p>
            </div>
            <Badge variant="secondary" className="w-fit gap-1.5 px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Acesso Admin
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Card>
          <CardContent className="p-3">
            <nav className="grid grid-cols-2 gap-2 lg:grid-cols-1" aria-label="Admin sections">
              {SECTIONS.map((item) => {
                const Icon = item.icon;
                const isActive = item.value === section;

                return (
                  <Button
                    key={item.value}
                    variant={isActive ? "default" : "ghost"}
                    className="justify-start gap-2 h-10"
                    onClick={() => setSection(item.value)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">{content}</CardContent>
        </Card>
      </div>
    </div>
  );
}
