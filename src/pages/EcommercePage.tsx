
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Globe, Rocket, ArrowRight, Store, Settings, Share2, Edit3, Eye } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export default function EcommercePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  if (!profile?.has_ecommerce) {
    return <EcommerceAcquisition />;
  }

  return <EcommerceDashboard profile={profile} />;
}

interface Profile {
  id: string;
  company_name: string;
  slug?: string;
  has_ecommerce?: boolean;
}

function EcommerceAcquisition() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleActivate = async () => {
    if (!profile) return;
    setLoading(true);
    
    // Generate a simple slug from company name or random id
    const slug = profile.company_name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ has_ecommerce: true, slug: slug })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      // Force reload to update context if refreshProfile is not sufficient
      window.location.reload(); 
    } catch (error) {
      console.error("Erro ao ativar ecommerce:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Rocket className="w-4 h-4" />
            <span>Novo Recurso</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6 leading-tight">
            Sua loja online, <br />
            <span className="text-primary">integrada ao estoque.</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Venda seus produtos na internet sem precisar atualizar estoque em dois lugares. 
            O Stokk cria sua vitrine virtual automaticamente.
          </p>
          
          <ul className="space-y-4 mb-10">
            {[
              "Site exclusivo com sua marca (stokk.shop/sualoja)",
              "Sincronização automática de estoque",
              "Pedidos caem direto no painel de vendas",
              "Cliente vê grade real (P, M, G) disponível",
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-base">
                <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-600 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {item}
              </li>
            ))}
          </ul>

          <div className="flex gap-4">
            <Button 
                size="lg" 
                className="rounded-full px-8 h-12 text-base font-semibold shadow-lg shadow-primary/20"
                onClick={handleActivate}
                disabled={loading}
            >
              {loading ? "Ativando..." : "Quero ativar minha loja"}
              {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
            </Button>
            <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-base">
              Ver exemplo
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            *Disponível no plano PRO ou como adicional.
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-[2rem] blur-3xl" />
          <div className="relative bg-card border border-border rounded-[2rem] shadow-2xl overflow-hidden">
            <div className="h-8 bg-muted border-b border-border flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-amber-400/80" />
              <div className="w-3 h-3 rounded-full bg-green-400/80" />
              <div className="ml-4 h-5 w-64 bg-background/50 rounded-full flex items-center px-3 text-[10px] text-muted-foreground">
                stokk.shop/loja-exemplo
              </div>
            </div>
            <div className="p-6 space-y-6 bg-background/50">
              <div className="h-48 rounded-xl bg-gradient-to-br from-muted to-muted/50 w-full animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-40 rounded-xl bg-muted/50 w-full" />
                <div className="h-40 rounded-xl bg-muted/50 w-full" />
              </div>
            </div>
            
            <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent flex items-end justify-center pb-8">
              <span className="text-sm font-medium bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border shadow-sm">
                Visualização do Cliente
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EcommerceDashboard({ profile }: { profile: any }) {
  const [copying, setCopying] = useState(false);
  const storeUrl = `https://stokk.shop/${profile.slug || 'sua-loja'}`;

  const copyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
            <Store className="w-8 h-8 text-primary" />
            Loja Virtual
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie a aparência e configurações da sua vitrine.
          </p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="gap-2" onClick={() => window.open(storeUrl, '_blank')}>
            <Eye className="w-4 h-4" />
            Ver Loja
           </Button>
           <Button className="gap-2">
            <Settings className="w-4 h-4" />
            Configurações
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Visão Geral</CardTitle>
            <CardDescription>Status da sua loja online hoje.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <div className="text-sm text-muted-foreground mb-1">Visitas Hoje</div>
                <div className="text-3xl font-bold text-primary">0</div>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <div className="text-sm text-muted-foreground mb-1">Pedidos</div>
                <div className="text-3xl font-bold">0</div>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <div className="text-sm text-muted-foreground mb-1">Conversão</div>
                <div className="text-3xl font-bold">0%</div>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <div className="text-sm text-muted-foreground mb-1">Receita</div>
                <div className="text-3xl font-bold">R$ 0</div>
              </div>
            </div>

            <div className="mt-8 p-4 rounded-xl border border-border bg-card/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Link da sua loja</h3>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-md">
                    {storeUrl}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={copyLink} className="shrink-0 w-full sm:w-auto">
                <Share2 className="w-4 h-4 mr-2" />
                {copying ? "Copiado!" : "Copiar Link"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
             <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="ghost" className="w-full justify-start gap-3 h-12">
              <Edit3 className="w-4 h-4 text-muted-foreground" />
              Editar Aparência
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 h-12">
              <ShoppingBag className="w-4 h-4 text-muted-foreground" />
              Produtos em Destaque
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 h-12">
               <Settings className="w-4 h-4 text-muted-foreground" />
               Frete e Entrega
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
           <CardHeader>
            <CardTitle>Produtos na Vitrine</CardTitle>
            <CardDescription>Gerencie quais produtos aparecem no seu site.</CardDescription>
           </CardHeader>
           <CardContent>
             <div className="text-center py-10 text-muted-foreground">
               <Store className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p>Seus produtos ativos aparecerão aqui.</p>
             </div>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
