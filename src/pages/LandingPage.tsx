import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Package,
  BarChart3,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Users,
  TrendingUp,
  Star,
  Sparkles,
  ShoppingBag,
  ScanBarcode,
  Bell,
  ChevronRight,
  Mail,
  Instagram,
  Code2,
  MousePointerClick,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import logo from "@/assets/logo.png";

/* ─── Animated counter hook ─── */
function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const step = target / (duration / 16);
          let current = 0;
          const timer = setInterval(() => {
            current += step;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, 16);
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const stat1 = useCountUp(500);
  const stat2 = useCountUp(50000);
  const stat3 = useCountUp(99);

  const features = [
    {
      icon: Package,
      title: "Grade Inteligente",
      desc: "Gerencie variantes por tamanho, cor e SKU com matriz de grade visual e intuitiva.",
      color: "from-blue-500/20 to-blue-600/5",
    },
    {
      icon: BarChart3,
      title: "Dashboard em Tempo Real",
      desc: "Métricas de vendas, faturamento, estoque e alertas em painéis dinâmicos.",
      color: "from-emerald-500/20 to-emerald-600/5",
    },
    {
      icon: ShieldCheck,
      title: "Segurança & Isolamento",
      desc: "Dados isolados por empresa com autenticação robusta e criptografia.",
      color: "from-violet-500/20 to-violet-600/5",
    },
    {
      icon: ScanBarcode,
      title: "Leitor de Código de Barras",
      desc: "Escaneie produtos direto pelo celular ou desktop com PDV integrado.",
      color: "from-amber-500/20 to-amber-600/5",
    },
    {
      icon: Users,
      title: "Multi-Empresa",
      desc: "Cada empresa tem seu sistema completo e independente de estoque.",
      color: "from-rose-500/20 to-rose-600/5",
    },
    {
      icon: Bell,
      title: "Alertas Inteligentes",
      desc: "Notificações automáticas de estoque baixo, esgotado e reposição.",
      color: "from-cyan-500/20 to-cyan-600/5",
    },
  ];

  const steps = [
    {
      num: "01",
      title: "Crie sua conta",
      desc: "Cadastro rápido. Em menos de 1 minuto você já está dentro do sistema.",
    },
    {
      num: "02",
      title: "Configure seu catálogo",
      desc: "Adicione seus produtos, grades de tamanho, cores e defina preços.",
    },
    {
      num: "03",
      title: "Gerencie tudo",
      desc: "Controle vendas, estoque, etiquetas e acompanhe o crescimento.",
    },
  ];

  const plans = [
    {
      name: "Essencial",
      subtitle: "Para quem está começando",
      price: "R$ 0",
      period: "/mês",
      popular: false,
      gradient: "",
      cta: "Começar grátis",
      features: [
        "Até 50 produtos cadastrados",
        "Até 100 vendas por mês",
        "1 usuário",
        "Dashboard com métricas básicas",
        "Alertas de estoque baixo",
      ],
      excluded: [
        "Leitor de código de barras",
        "Impressão de etiquetas",
        "Suporte prioritário",
      ],
    },
    {
      name: "Crescimento",
      subtitle: "Para lojas em expansão",
      price: "R$ 79",
      priceOld: "R$ 119",
      period: "/mês",
      popular: true,
      gradient: "bg-gradient-to-br from-foreground to-foreground/80",
      cta: "Começar 7 dias grátis",
      features: [
        "Até 500 produtos cadastrados",
        "Vendas ilimitadas",
        "Até 5 usuários",
        "Relatórios avançados de vendas",
        "Leitor de código de barras",
        "Impressão de etiquetas",
        "Alertas inteligentes",
        "Suporte prioritário por email",
      ],
      excluded: [],
    },
    {
      name: "Profissional",
      subtitle: "Para operações completas",
      price: "R$ 149",
      priceOld: "R$ 199",
      period: "/mês",
      popular: false,
      gradient: "",
      cta: "Começar 7 dias grátis",
      features: [
        "Produtos ilimitados",
        "Vendas ilimitadas",
        "Usuários ilimitados",
        "Relatórios avançados + exportação",
        "Leitor de código de barras",
        "Impressão de etiquetas em lote",
        "Gestão multi-loja",
        "Suporte VIP via WhatsApp",
        "Consultoria de implantação",
      ],
      excluded: [],
    },
  ];

  const testimonials = [
    {
      name: "Maria Silva",
      role: "Dona da Boutique Rosa",
      text: "O Stokk transformou a gestão do meu estoque. Antes eu perdia vendas por não saber o que tinha disponível.",
      avatar: "MS",
    },
    {
      name: "Carlos Santos",
      role: "Gerente de Loja",
      text: "A grade de tamanhos e cores é perfeita para vestuário. O controle por SKU facilitou muito nosso dia a dia.",
      avatar: "CS",
    },
    {
      name: "Ana Oliveira",
      role: "Empreendedora",
      text: "Sistema intuitivo e completo. Os alertas de estoque baixo me ajudam a não perder nenhuma venda.",
      avatar: "AO",
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ═══ HEADER ═══ */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-sm" : "bg-transparent"}`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Stokk" className="w-9 h-9 rounded-xl" />
            <span className="font-heading font-bold text-xl tracking-tight">
              Stokk
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Recursos
            </a>
            <a
              href="#how"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Como funciona
            </a>
            <a
              href="#pricing"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Planos
            </a>
            <a
              href="#testimonials"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Depoimentos
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/login")}
            >
              Entrar
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/login")}
              className="gap-2 rounded-full px-5"
            >
              Começar grátis <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/3 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-sm text-primary mb-8 animate-in fade-in slide-in-from-bottom-3 duration-700">
            <Sparkles className="w-4 h-4" />
            Gestão de estoque inteligente para moda
          </div>

          <h1 className="text-5xl md:text-7xl font-heading font-bold leading-[1.1] tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            O controle total
            <span className="block mt-2">
              do seu{" "}
              <span className="relative inline-block">
                <span className="relative z-10">estoque</span>
                <span className="absolute bottom-2 left-0 right-0 h-3 bg-primary/15 -skew-x-3 rounded" />
              </span>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mt-8 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
            Plataforma completa para gerenciar grades, cores, SKUs e vendas do
            seu negócio de moda. Do cadastro à venda, tudo em um só lugar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
            <Button
              size="lg"
              onClick={() => navigate("/login")}
              className="gap-2 text-base px-8 rounded-full h-12 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            >
              <MousePointerClick className="w-5 h-5" />
              Acessar Sistema
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() =>
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="text-base px-8 rounded-full h-12"
            >
              Explorar Recursos
            </Button>
          </div>

          {/* Floating badges */}
          <div className="hidden lg:block">
            <div className="absolute top-44 left-8 xl:left-16 glass-card rounded-2xl p-4 animate-in fade-in slide-in-from-left-8 duration-1000 delay-500 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-muted-foreground">Vendas hoje</p>
                  <p className="font-heading font-bold text-lg">+R$ 2.450</p>
                </div>
              </div>
            </div>
            <div className="absolute top-64 right-8 xl:right-16 glass-card rounded-2xl p-4 animate-in fade-in slide-in-from-right-8 duration-1000 delay-700 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-muted-foreground">Produtos</p>
                  <p className="font-heading font-bold text-lg">1.247 SKUs</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative max-w-4xl mx-auto mt-20">
          <div className="glass-card rounded-2xl p-8 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 md:divide-x divide-border">
            <div className="text-center" ref={stat1.ref}>
              <p className="text-4xl font-heading font-bold">{stat1.count}+</p>
              <p className="text-sm text-muted-foreground mt-1">
                Empresas ativas
              </p>
            </div>
            <div className="text-center" ref={stat2.ref}>
              <p className="text-4xl font-heading font-bold">
                {stat2.count.toLocaleString("pt-BR")}+
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Produtos gerenciados
              </p>
            </div>
            <div className="text-center" ref={stat3.ref}>
              <p className="text-4xl font-heading font-bold">{stat3.count}%</p>
              <p className="text-sm text-muted-foreground mt-1">
                Satisfação dos clientes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-medium text-primary/80 tracking-wider uppercase">
              Recursos
            </span>
            <h2 className="text-3xl md:text-5xl font-heading font-bold mt-3">
              Tudo que você precisa,
              <br className="hidden md:block" /> nada que você não precisa
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-lg">
              Ferramentas profissionais pensadas para o dia a dia da gestão de
              moda.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group glass-card rounded-2xl p-7 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                >
                  <f.icon className="w-7 h-7 text-foreground/80" />
                </div>
                <h3 className="font-heading font-semibold text-lg">
                  {f.title}
                </h3>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how" className="py-24 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-medium text-primary/80 tracking-wider uppercase">
              Como funciona
            </span>
            <h2 className="text-3xl md:text-5xl font-heading font-bold mt-3">
              Comece em 3 passos simples
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={s.num} className="relative text-center md:text-left">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-full h-px border-t-2 border-dashed border-border" />
                )}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-foreground text-background font-heading font-bold text-xl mb-5 relative z-10">
                  {s.num}
                </div>
                <h3 className="font-heading font-semibold text-lg">
                  {s.title}
                </h3>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-medium text-primary/80 tracking-wider uppercase">
              Planos
            </span>
            <h2 className="text-3xl md:text-5xl font-heading font-bold mt-3">
              Invista menos do que um cafezinho por dia
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              Todos os planos pagos com <span className="font-semibold text-foreground">7 dias grátis</span> para testar. Cancele quando quiser.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 relative transition-all duration-300 hover:-translate-y-1 ${
                  plan.popular
                    ? `${plan.gradient} text-background shadow-2xl shadow-foreground/10 scale-[1.02]`
                    : "glass-card hover:shadow-lg"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background text-foreground text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
                    ✦ MAIS ESCOLHIDO
                  </div>
                )}
                <h3 className="font-heading font-bold text-xl">{plan.name}</h3>
                <p className={`text-sm mt-1 ${plan.popular ? 'text-background/60' : 'text-muted-foreground'}`}>{plan.subtitle}</p>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-5xl font-heading font-bold tracking-tight">
                    {plan.price}
                  </span>
                  <span
                    className={`text-sm ${plan.popular ? "text-background/60" : "text-muted-foreground"}`}
                  >
                    {plan.period}
                  </span>
                </div>
                {plan.priceOld && (
                  <p className={`text-sm mt-1 line-through ${plan.popular ? 'text-background/40' : 'text-muted-foreground/60'}`}>
                    {plan.priceOld}/mês
                  </p>
                )}
                <ul className="mt-8 space-y-3.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${plan.popular ? "text-background/70" : "text-emerald-500"}`}
                      />
                      {f}
                    </li>
                  ))}
                  {plan.excluded?.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm line-through opacity-40">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full mt-8 rounded-full h-11 ${plan.popular ? "bg-background text-foreground hover:bg-background/90" : ""}`}
                  variant={plan.popular ? "secondary" : "outline"}
                  onClick={() => navigate("/login")}
                >
                  {plan.cta}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">
            Sem fidelidade. Sem taxa de adesão. Sem surpresas.
          </p>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section id="testimonials" className="py-24 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-medium text-primary/80 tracking-wider uppercase">
              Depoimentos
            </span>
            <h2 className="text-3xl md:text-5xl font-heading font-bold mt-3">
              Quem usa, recomenda
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="glass-card rounded-2xl p-7 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  "{t.text}"
                </p>
                <div className="mt-6 pt-5 border-t border-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl bg-foreground text-background p-12 md:p-16 text-center overflow-hidden">
            {/* CTA background decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />

            <div className="relative z-10">
              <Zap className="w-12 h-12 mx-auto mb-6 text-background/30" />
              <h2 className="text-3xl md:text-4xl font-heading font-bold">
                Pronto para ter controle total?
              </h2>
              <p className="text-background/60 mt-4 text-lg max-w-xl mx-auto">
                Comece a usar o Stokk agora e transforme a gestão do seu estoque
                de moda.
              </p>
              <Button
                size="lg"
                onClick={() => navigate("/login")}
                className="mt-8 gap-2 text-base px-10 rounded-full h-12 bg-background text-foreground hover:bg-background/90 shadow-lg"
              >
                Começar Agora — É grátis
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src={logo} alt="Stokk" className="w-9 h-9 rounded-xl" />
                <span className="font-heading font-bold text-xl">Stokk</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                Plataforma completa de gestão de estoque para lojas de moda.
                Controle grades, vendas e cresça com inteligência.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-heading font-semibold text-sm mb-4">
                Produto
              </h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#features"
                    className="hover:text-foreground transition-colors"
                  >
                    Recursos
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-foreground transition-colors"
                  >
                    Planos
                  </a>
                </li>
                <li>
                  <a
                    href="#testimonials"
                    className="hover:text-foreground transition-colors"
                  >
                    Depoimentos
                  </a>
                </li>
              </ul>
            </div>

            {/* Developer */}
            <div>
              <h4 className="font-heading font-semibold text-sm mb-4">
                Desenvolvido por
              </h4>
              <div className="space-y-2.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 shrink-0" />
                  <span className="font-medium text-foreground">Kode</span>
                  <span className="text-muted-foreground">
                    | Desenvolvimento Web
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Profissional: Micael Rauan
                </p>
                <div className="flex items-center gap-2">
                  <Instagram className="w-4 h-4 shrink-0" />
                  <a
                    href="https://instagram.com/kode.devbr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    @kode.devbr
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 shrink-0" />
                  <a
                    href="mailto:kode.dev.br@gmail.com"
                    className="hover:text-foreground transition-colors"
                  >
                    kode.dev.br@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Stokk — Todos os direitos reservados.
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              Feito com <span className="text-red-400">♥</span> por{" "}
              <a
                href="https://instagram.com/kode.devbr"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:underline"
              >
                Kode Desenvolvimento Web
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
