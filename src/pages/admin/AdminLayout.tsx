import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Users, CreditCard, Activity, Shield,
  LogOut, Sun, Moon, Menu, X
} from 'lucide-react';
import logo from '@/assets/logo.png';

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Painel', end: true },
  { to: '/admin/usuarios', icon: Users, label: 'Empresas' },
  { to: '/admin/planos', icon: CreditCard, label: 'Planos' },
  { to: '/admin/atividade', icon: Activity, label: 'Atividade' },
];

export default function AdminLayout() {
  const { signOut } = useAuth();
  const location = useLocation();
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  return (
    <div className="flex min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-sidebar text-sidebar-foreground px-4 py-3 lg:hidden">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Stokk logo" className="w-8 h-8 rounded-lg" />
          <h1 className="font-heading font-bold text-sidebar-primary text-base">Admin</h1>
        </div>
        <button onClick={() => setSidebarOpen(o => !o)} className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col shrink-0 transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-sidebar-primary text-lg leading-tight">Admin</h1>
              <p className="text-xs text-sidebar-muted">Painel Administrativo</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {adminNav.map(item => {
            const isActive = item.to === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.to);
            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/admin'}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}>
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <button onClick={() => setDark(d => !d)} className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-all">
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{dark ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>
          <button onClick={signOut} className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm text-destructive hover:bg-sidebar-accent transition-all">
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto w-full">
        <div className="p-4 pt-16 lg:p-8 lg:pt-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
