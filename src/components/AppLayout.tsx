import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tags,
  ScanBarcode,
  Bell,
  ArrowRightLeft,
  ShoppingCart,
  History,
  Warehouse,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  Shield,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useInventoryContext } from "@/contexts/InventoryContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useCallback } from "react";
import logo from "@/assets/logo.png";
import BlockedAccountOverlay from "@/components/BlockedAccountOverlay";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navSections = [
  {
    label: "Principal",
    items: [
      { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/produtos", icon: Package, label: "Produtos" },
      { to: "/estoque", icon: Warehouse, label: "Estoque" },
    ],
  },
  {
    label: "Vendas",
    items: [
      { to: "/vendas", icon: ShoppingCart, label: "Vendas" },
      { to: "/historico", icon: History, label: "Histórico" },
      { to: "/operacoes", icon: ArrowRightLeft, label: "Operações" },
    ],
  },
  {
    label: "Ferramentas",
    items: [
      { to: "/etiquetas", icon: Tags, label: "Etiquetas" },
      { to: "/leitor", icon: ScanBarcode, label: "Leitor" },
      { to: "/avisos", icon: Bell, label: "Avisos" },
    ],
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { unreadAlerts } = useInventoryContext();
  const { signOut, isAdmin, profile } = useAuth();
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark";
    }
    return false;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", collapsed ? "true" : "false");
  }, [collapsed]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "b") {
      e.preventDefault();
      setCollapsed((c) => !c);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const companyName = profile?.company_name || "Minha Empresa";
  const planLabel = profile?.plan === "pro" ? "Pro" : "Grátis";
  const sidebarW = collapsed ? "lg:w-[68px]" : "lg:w-60";

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex h-screen overflow-hidden bg-background">
        <BlockedAccountOverlay />

        {/* ── Mobile top bar ── */}
        <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between bg-sidebar px-4 lg:hidden border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="Stokk" className="w-7 h-7 rounded-md" />
            <span className="font-heading font-bold text-sidebar-primary text-sm">
              Stokk
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="p-2 -mr-1 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/60 active:scale-95 transition-all"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </header>

        {/* ── Overlay (mobile) ── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ══════════ SIDEBAR ══════════ */}
        <aside
          className={[
            "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
            "transition-[width,transform] duration-300 ease-[cubic-bezier(.4,0,.2,1)]",
            "lg:relative lg:translate-x-0",
            sidebarOpen ? "translate-x-0 w-60" : "-translate-x-full w-60",
            sidebarW,
          ].join(" ")}
        >
          {/* ─ Brand ─ */}
          <div className="flex items-center gap-2.5 px-4 h-14 shrink-0 border-b border-sidebar-border">
            <img
              src={logo}
              alt="Stokk"
              className="w-8 h-8 rounded-md shrink-0"
            />
            {!collapsed && (
              <div className="min-w-0 hidden lg:block">
                <p className="font-heading font-bold text-sidebar-primary text-base leading-none truncate">
                  Stokk
                </p>
                <p className="text-[10px] text-sidebar-muted mt-0.5">
                  Gestão de Estoque
                </p>
              </div>
            )}
            {/* Always show on mobile */}
            <div className="min-w-0 lg:hidden">
              <p className="font-heading font-bold text-sidebar-primary text-base leading-none truncate">
                Stokk
              </p>
              <p className="text-[10px] text-sidebar-muted mt-0.5">
                Gestão de Estoque
              </p>
            </div>
          </div>

          {/* ─ Company ─ */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 shrink-0 border-b border-sidebar-border">
            <div className="w-7 h-7 rounded-md bg-sidebar-accent flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-sidebar-primary leading-none">
                {getInitials(companyName)}
              </span>
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1 hidden lg:block">
                <p className="text-xs font-medium text-sidebar-primary truncate leading-tight">
                  {companyName}
                </p>
                <span
                  className={`inline-block text-[9px] font-semibold px-1.5 py-px rounded mt-0.5 ${
                    profile?.plan === "pro"
                      ? "bg-blue-500/15 text-blue-400"
                      : "bg-sidebar-accent text-sidebar-muted"
                  }`}
                >
                  {planLabel}
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1 lg:hidden">
              <p className="text-xs font-medium text-sidebar-primary truncate leading-tight">
                {companyName}
              </p>
              <span
                className={`inline-block text-[9px] font-semibold px-1.5 py-px rounded mt-0.5 ${
                  profile?.plan === "pro"
                    ? "bg-blue-500/15 text-blue-400"
                    : "bg-sidebar-accent text-sidebar-muted"
                }`}
              >
                {planLabel}
              </span>
            </div>
          </div>

          {/* ─ Nav ─ */}
          <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3 space-y-4">
            {navSections.map((section) => (
              <div key={section.label}>
                {/* Section label */}
                {!collapsed ? (
                  <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted hidden lg:block">
                    {section.label}
                  </p>
                ) : (
                  <div className="hidden lg:flex justify-center mb-1.5">
                    <span className="w-4 h-px bg-sidebar-border rounded-full" />
                  </div>
                )}
                <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted lg:hidden">
                  {section.label}
                </p>

                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.to;
                    const hasAlert = item.to === "/avisos" && unreadAlerts > 0;

                    const link = (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={[
                          "group relative flex items-center rounded-lg text-[13px] font-medium transition-colors duration-150",
                          collapsed
                            ? "lg:justify-center lg:h-10 lg:w-10 lg:mx-auto lg:px-0 px-2.5 py-2 gap-2.5"
                            : "px-2.5 py-2 gap-2.5",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-primary"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-primary",
                        ].join(" ")}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-sidebar-primary rounded-r-full" />
                        )}
                        <item.icon
                          className={`w-[18px] h-[18px] shrink-0 transition-colors duration-150 ${
                            isActive
                              ? "text-sidebar-primary"
                              : "text-sidebar-muted group-hover:text-sidebar-primary"
                          }`}
                        />
                        {!collapsed && (
                          <span className="truncate hidden lg:inline">
                            {item.label}
                          </span>
                        )}
                        <span className="truncate lg:hidden">{item.label}</span>
                        {hasAlert && (
                          <span
                            className={`bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-soft ${
                              collapsed
                                ? "lg:absolute lg:-top-0.5 lg:-right-0.5 lg:w-4 lg:h-4 ml-auto w-5 h-5"
                                : "ml-auto w-5 h-5"
                            }`}
                          >
                            {unreadAlerts}
                          </span>
                        )}
                      </NavLink>
                    );

                    if (collapsed) {
                      return (
                        <Tooltip key={item.to}>
                          <TooltipTrigger asChild>
                            <div className="hidden lg:block">{link}</div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            sideOffset={8}
                            className="text-xs font-medium"
                          >
                            {item.label}
                            {hasAlert && (
                              <span className="ml-1.5 text-destructive font-bold">
                                ({unreadAlerts})
                              </span>
                            )}
                          </TooltipContent>
                          <div className="lg:hidden">{link}</div>
                        </Tooltip>
                      );
                    }

                    return link;
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* ─ Footer ─ */}
          <div
            className={`shrink-0 border-t border-sidebar-border p-2 space-y-0.5 ${collapsed ? "lg:px-1.5" : ""}`}
          >
            {isAdmin && (
              <FooterItem
                collapsed={collapsed}
                icon={Shield}
                label="Admin"
                to="/admin"
              />
            )}
            <FooterItem
              collapsed={collapsed}
              icon={dark ? Sun : Moon}
              label={dark ? "Claro" : "Escuro"}
              onClick={() => setDark((d) => !d)}
            />
            <FooterItem
              collapsed={collapsed}
              icon={LogOut}
              label="Sair"
              onClick={signOut}
              destructive
            />

            {/* Collapse toggle */}
            <div className="hidden lg:block pt-1.5 mt-1 border-t border-sidebar-border">
              <button
                onClick={() => setCollapsed((c) => !c)}
                className={`flex items-center w-full rounded-md text-[11px] text-sidebar-muted hover:text-sidebar-primary hover:bg-sidebar-accent/50 transition-colors py-1.5 ${
                  collapsed ? "justify-center" : "gap-2 px-2.5"
                }`}
                title="Ctrl+B"
              >
                {collapsed ? (
                  <ChevronsRight className="w-3.5 h-3.5" />
                ) : (
                  <>
                    <ChevronsLeft className="w-3.5 h-3.5" />
                    <span>Recolher</span>
                    <kbd className="ml-auto text-[9px] bg-sidebar-accent px-1 py-0.5 rounded text-sidebar-muted">
                      ⌘B
                    </kbd>
                  </>
                )}
              </button>
            </div>
          </div>
        </aside>

        {/* ══════════ MAIN ══════════ */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 pt-[calc(3.5rem+1rem)] lg:p-6 lg:pt-6">
            {children}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}

/* ─── Footer action item ─── */
interface FooterItemProps {
  collapsed: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  to?: string;
  destructive?: boolean;
}

function FooterItem({
  collapsed,
  icon: Icon,
  label,
  onClick,
  to,
  destructive,
}: FooterItemProps) {
  const cls = [
    "group flex items-center w-full rounded-md text-[13px] font-medium transition-colors duration-150",
    collapsed
      ? "lg:justify-center lg:h-9 lg:w-9 lg:mx-auto lg:px-0 px-2.5 py-1.5 gap-2.5"
      : "px-2.5 py-1.5 gap-2.5",
    destructive
      ? "text-destructive/80 hover:text-destructive hover:bg-destructive/10"
      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-primary",
  ].join(" ");

  const inner = (
    <>
      <Icon className="w-[16px] h-[16px] shrink-0" />
      {!collapsed && <span className="hidden lg:inline">{label}</span>}
      <span className="lg:hidden">{label}</span>
    </>
  );

  const el = to ? (
    <NavLink to={to} className={cls}>
      {inner}
    </NavLink>
  ) : (
    <button onClick={onClick} className={cls}>
      {inner}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="hidden lg:block">{el}</div>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={8}
          className="text-xs font-medium"
        >
          {label}
        </TooltipContent>
        <div className="lg:hidden">{el}</div>
      </Tooltip>
    );
  }

  return el;
}
