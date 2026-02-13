import { ShieldX, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function BlockedAccountOverlay() {
  const { signOut, profile } = useAuth();

  if (!profile || profile.is_active !== false) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Blurred backdrop over the entire system */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="rounded-2xl border border-destructive/20 bg-card shadow-2xl shadow-destructive/10 p-8 text-center space-y-6">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-destructive" />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-heading font-bold text-foreground">
              Conta Bloqueada
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Sua conta foi desativada pelo administrador do sistema.
              Para reativar o acesso, entre em contato com o suporte ou o administrador.
            </p>
          </div>

          {/* Contact info hint */}
          <div className="rounded-lg bg-muted/50 border border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Entre em contato com o <span className="font-semibold text-foreground">administrador do sistema</span> para mais informações sobre o bloqueio da sua conta.
            </p>
          </div>

          {/* Logout button */}
          <Button
            onClick={signOut}
            variant="destructive"
            size="lg"
            className="w-full gap-2 text-base"
          >
            <LogOut className="w-5 h-5" />
            Sair da Conta
          </Button>
        </div>
      </div>
    </div>
  );
}
