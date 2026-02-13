import { NavLink, useLocation } from 'react-router-dom';
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
  Shield
} from 'lucide-react';
import { useInventoryContext } from '@/contexts/InventoryContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import logo from '@/assets/logo.png';
import BlockedAccountOverlay from '@/components/BlockedAccountOverlay';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/produtos', icon: Package, label: 'Produtos' },
  { to: '/estoque', icon: Warehouse, label: 'Estoque' },
  { to: '/vendas', icon: ShoppingCart, label: 'Vendas' },
  { to: '/historico', icon: History, label: 'Histórico' },
  { to: '/operacoes', icon: ArrowRightLeft, label: 'Operações' },
  { to: '/etiquetas', icon: Tags, label: 'Etiquetas' },
  { to: '/leitor', icon: ScanBarcode, label: 'Leitor' },
  { to: '/avisos', icon: Bell, label: 'Avisos' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { unreadAlerts } = useInventoryContext();
  const { signOut, isAdmin, profile } = useAuth();
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen">
      {/* Blocked account overlay */}
      <BlockedAccountOverlay />

      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-sidebar text-sidebar-foreground px-4 py-3 lg:hidden">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Stokk logo" className="w-8 h-8 rounded-lg" />
          <h1 className="font-heading font-bold text-sidebar-primary text-base">Stokk</h1>
        </div>
        <button onClick={() => setSidebarOpen(o => !o)} className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col shrink-0 transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Stokk logo" className="w-10 h-10 rounded-lg" />
            <div>
              <h1 className="font-heading font-bold text-sidebar-primary text-lg leading-tight">Stokk</h1>
              <p className="text-xs text-sidebar-muted">Gerenciamento de Estoque</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-sidebar-accent text-sidebar-primary' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {item.to === '/avisos' && unreadAlerts > 0 && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse-soft">
                    {unreadAlerts}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-2">
          {profile && (
            <div className="px-4 py-2">
              <p className="text-xs text-sidebar-muted truncate">{profile.company_name || 'Minha Empresa'}</p>
            </div>
          )}
          {isAdmin && (
            <NavLink
              to="/admin"
              className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-all"
            >
              <Shield className="w-4 h-4" />
              <span>Painel Admin</span>
            </NavLink>
          )}
          <button
            onClick={() => setDark(d => !d)}
            className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-all"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{dark ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm text-destructive hover:bg-sidebar-accent transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
          <p className="text-xs text-sidebar-muted text-center">v2.0 — Stokk Pro</p>
        </div>
      </aside>

      <main className="flex-1 overflow-auto w-full">
        <div className="p-4 pt-16 lg:p-8 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
