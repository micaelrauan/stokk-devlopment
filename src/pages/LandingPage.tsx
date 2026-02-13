import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Package, BarChart3, ShieldCheck, Zap, ArrowRight, 
  CheckCircle2, Users, TrendingUp, Star
} from 'lucide-react';
import logo from '@/assets/logo.png';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    { icon: Package, title: 'Controle de Grade', desc: 'Gerencie variantes por tamanho, cor e SKU com matriz de grade inteligente.' },
    { icon: BarChart3, title: 'Relatórios em Tempo Real', desc: 'Dashboards com métricas de vendas, estoque e alertas automatizados.' },
    { icon: ShieldCheck, title: 'Segurança Total', desc: 'Dados isolados por empresa com autenticação robusta e criptografia.' },
    { icon: Zap, title: 'PDV Integrado', desc: 'Ponto de venda com leitor de código de barras e impressão de etiquetas.' },
    { icon: Users, title: 'Multi-Empresa', desc: 'Cada empresa tem seu próprio sistema de estoque independente.' },
    { icon: TrendingUp, title: 'Gestão Inteligente', desc: 'Alertas de estoque baixo, esgotado e controle de estoque mínimo.' },
  ];

  const plans = [
    { 
      name: 'Gratuito', price: 'R$ 0', period: '/mês', popular: false,
      features: ['Até 50 produtos', 'Até 100 vendas/mês', '1 usuário', 'Dashboard básico']
    },
    { 
      name: 'Profissional', price: 'R$ 99', period: '/mês', popular: true,
      features: ['Até 1.000 produtos', 'Vendas ilimitadas', '10 usuários', 'Relatórios avançados', 'Suporte prioritário', 'Leitor de código de barras']
    },
    { 
      name: 'Premium', price: 'R$ 199', period: '/mês', popular: false,
      features: ['Produtos ilimitados', 'Vendas ilimitadas', 'Usuários ilimitados', 'Relatórios avançados', 'Suporte VIP', 'API de integração', 'Personalização completa']
    },
  ];

  const testimonials = [
    { name: 'Maria Silva', role: 'Dona da Boutique Rosa', text: 'O Stokk transformou a gestão do meu estoque. Antes eu perdia vendas por não saber o que tinha disponível.' },
    { name: 'Carlos Santos', role: 'Gerente de Loja', text: 'A grade de tamanhos e cores é perfeita para vestuário. O controle por SKU facilitou muito nosso dia a dia.' },
    { name: 'Ana Oliveira', role: 'Empreendedora', text: 'Sistema intuitivo e completo. Os alertas de estoque baixo me ajudam a não perder vendas.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Stokk" className="w-9 h-9 rounded-xl" />
            <span className="font-heading font-bold text-xl">Stokk</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/login')}>Entrar</Button>
            <Button onClick={() => navigate('/login')} className="gap-2">
              Começar Agora <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-sm text-primary mb-6">
            <Star className="w-4 h-4" />
            Sistema profissional de gestão de estoque
          </div>
          <h1 className="text-4xl md:text-6xl font-heading font-bold leading-tight">
            Controle total do seu
            <span className="block text-primary">estoque de vestuário</span>
          </h1>
          <p className="text-lg text-muted-foreground mt-6 max-w-2xl mx-auto">
            O Stokk é a plataforma completa para gerenciar grades de tamanho, cores, SKUs e 
            vendas do seu negócio de moda. Simples, rápido e seguro.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button size="lg" onClick={() => navigate('/login')} className="gap-2 text-base px-8">
              Acessar Sistema <ArrowRight className="w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-base px-8">
              Ver Recursos
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-heading font-bold">Tudo que você precisa</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Ferramentas profissionais para gestão completa do estoque da sua loja de roupas.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="glass-card rounded-2xl p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg">{f.title}</h3>
                <p className="text-muted-foreground text-sm mt-2">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-heading font-bold">Planos que cabem no seu bolso</h2>
            <p className="text-muted-foreground mt-3">Escolha o plano ideal para o tamanho do seu negócio.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map(plan => (
              <div key={plan.name} className={`glass-card rounded-2xl p-7 relative ${plan.popular ? 'ring-2 ring-primary shadow-lg' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                    MAIS POPULAR
                  </div>
                )}
                <h3 className="font-heading font-bold text-xl">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-heading font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-6" variant={plan.popular ? 'default' : 'outline'} onClick={() => navigate('/login')}>
                  Começar Agora
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-heading font-bold">O que nossos clientes dizem</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.name} className="glass-card rounded-2xl p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-warning text-warning" />)}
                </div>
                <p className="text-sm text-muted-foreground italic">"{t.text}"</p>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold">Pronto para transformar seu estoque?</h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Comece a usar o Stokk hoje e tenha controle total do seu negócio de moda.
          </p>
          <Button size="lg" onClick={() => navigate('/login')} className="mt-8 gap-2 text-base px-10">
            Começar Agora <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Stokk" className="w-7 h-7 rounded-lg" />
            <span className="font-heading font-bold">Stokk</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Stokk — Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
