import React, { useState } from "react";
import AdminDashboard from "./AdminDashboard";
import CompanyPanel from "./CompanyPanel";
import AdminBillingPanel from "./AdminBillingPanel";
import SystemMaintenancePanel from "./SystemMaintenancePanel";

const TABS = [
  { label: "Dashboard", value: "dashboard" },
  { label: "Empresas", value: "companies" },
  { label: "Mensalidades", value: "billings" },
  { label: "Manutenção", value: "maintenance" },
];

export default function AdminPage() {
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
          Painel Administrativo
        </h1>
        <p className="text-muted-foreground mt-1">Gestão global do sistema Stokk</p>
      </div>

      <div className="glass-card p-1 flex gap-1 mb-2 border border-border/50 rounded-xl overflow-x-auto w-full sm:w-fit">
        {TABS.map((t) => (
          <button
            key={t.value}
            className={`px-6 py-2 rounded-lg font-medium text-sm transition-all duration-200 focus:outline-none whitespace-nowrap shrink-0 ${
              tab === t.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
            }`}
            onClick={() => setTab(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="glass-card rounded-2xl border border-border/50 p-2 min-h-[400px]">
        {tab === "dashboard" && <AdminDashboard />}
        {tab === "companies" && <CompanyPanel />}
        {tab === "billings" && <AdminBillingPanel />}
        {tab === "maintenance" && <SystemMaintenancePanel />}
      </div>
    </div>
  );
}
