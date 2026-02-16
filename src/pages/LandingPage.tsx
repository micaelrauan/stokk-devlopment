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
  Mail,
  Instagram,
  Code2,
  MousePointerClick,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import logo from "@/assets/logo.png";
import { Menu } from "lucide-react";



export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);



  // Recursos incluídos em cada plano
  // Recursos incluídos em cada plano
  const proFeatures = [
    { text: "Produtos ilimitados" },
    { text: "Controle de vendas avançado" },
    { text: "Gestão completa de estoque" },
    { text: "Grade de cores e tamanhos" },
    { text: "Dashboard de vendas em tempo real" },
    { text: "Alertas inteligentes de estoque" },
    { text: "Etiquetas e impressão" },
    { text: "Múltiplos usuários" },
    { text: "Suporte prioritário" },
    { text: "Relatórios avançados" },
  ];

  const features = [
    {
      icon: Package,
      title: "Grade de Verdade",
      desc: "Chega de improviso. Controle P, M, G, Azul, Vermelho... tudo organizado.",
      color: "from-blue-500/20 to-blue-600/5",
    },
    {
      icon: BarChart3,
      title: "Vendas do Dia",
      desc: "Saiba exatamente quanto você vendeu hoje, ontem e no mês em tempo real.",
      color: "from-emerald-500/20 to-emerald-600/5",
    },
    {
      icon: ShieldCheck,
      title: "Seus Dados Seguros",
      desc: "Backup automático e proteção total. Sua loja não para se o computador quebrar.",
      color: "from-violet-500/20 to-violet-600/5",
    },
    {
      icon: ScanBarcode,
      title: "Use o Celular",
      desc: "Transforme a câmera do seu celular em um leitor de código de barras.",
      color: "from-amber-500/20 to-amber-600/5",
    },
    {
      icon: Users,
      title: "Equipe Conectada",
      desc: "Dê acesso aos vendedores com permissões limitadas. Você controla tudo.",
      color: "from-rose-500/20 to-rose-600/5",
    },
    {
      icon: Bell,
      title: "Avisos de Reposição",
      desc: "O Stokk te avisa quando uma peça está acabando antes de você perder a venda.",
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

  const testimonials = [
    {
      name: "Carla Mendes",
      role: "Loja Flor de Lis",
      text: "Eu anotava tudo no caderno e sempre perdia peças. O Stokk organizou minha vida, agora sei exato o que tenho.",
      avatar: "CM",
    },
    {
      name: "Ricardo Lima",
      role: "Closet Masculino",
      text: "A função de grade é essencial. Consigo ver rápido se tenho a Camisa Polo Azul no tamanho M. Recomendo!",
      avatar: "RL",
    },
    {
      name: "Ana Betina",
      role: "Boutique Ana",
      text: "Preço justo e sistema fácil. Minhas vendedoras aprenderam em 10 minutos. O suporte também é muito bom.",
      avatar: "AB",
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ═══ HEADER ═══ */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-background/95 backdrop-blur-2xl border-b border-border/50 shadow-lg shadow-black/5" : "bg-transparent"}`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <img src={logo} alt="Stokk" className="w-10 h-10 rounded-xl relative z-10 shadow-sm" />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
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
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/login")}
              className="gap-2 rounded-full px-5 text-sm"
            >
              Entrar
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl px-6 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Recursos
            </a>
            <a
              href="#how"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Como funciona
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Planos
            </a>
            <a
              href="#testimonials"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Depoimentos
            </a>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigate("/login");
                setMobileMenuOpen(false);
              }}
              className="w-full mt-2"
            >
              Entrar
            </Button>
          </div>
        )}
      </header>

      {/* ═══ HERO ═══ */}
      <section className="relative pt-32 pb-32 px-6 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-primary/8 via-purple-500/5 to-transparent rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-bl from-indigo-500/8 via-primary/5 to-transparent rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/3 to-purple-500/3 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 border border-primary/20 text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-3 duration-700 hover:scale-105 transition-transform cursor-default shadow-lg shadow-primary/5">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="text-foreground/90">
              Mais de <span className="font-bold text-foreground">120 lojas</span> organizadas
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold leading-tight mb-6">
            Controle sua loja de roupas
            <br className="hidden md:block" />{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-indigo-600 animate-gradient">
              sem dor de cabeça
            </span>
          </h2>
          <p className="text-muted-foreground mt-6 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed">
            Abandone o caderninho e as planilhas confusas. O sistema simples e
            visual feito para quem vende moda.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            <Button 
              size="lg" 
              className="rounded-full px-10 h-14 text-base font-semibold shadow-2xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-1 hover:scale-105 transition-all duration-300 group bg-gradient-to-r from-primary to-primary/90" 
              onClick={() => navigate("/login")}
            >
              Acessar minha conta
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="rounded-full px-10 h-14 text-base hover:bg-muted/80 hover:border-foreground/20 hover:-translate-y-0.5 transition-all duration-300 border-2" 
              onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Ver como funciona
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group glass-card rounded-3xl p-8 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2 transition-all duration-500 cursor-default border-2 border-transparent hover:border-primary/10 backdrop-blur-xl"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}
                >
                  <f.icon className="w-8 h-8 text-foreground/90" />
                </div>
                <h3 className="font-heading font-bold text-xl mb-3">
                  {f.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how" className="py-28 px-6 bg-gradient-to-b from-muted/30 via-muted/50 to-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[length:24px_24px] pointer-events-none opacity-50" />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-20">
            <span className="inline-block text-sm font-bold text-primary/90 tracking-wider uppercase px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
              Como funciona
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mt-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Comece em 3 passos simples
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {steps.map((s, i) => (
              <div key={s.num} className="relative text-center md:text-left group">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-full h-px border-t-2 border-dashed border-border/50" />
                )}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-foreground to-foreground/80 text-background font-heading font-bold text-2xl mb-6 relative z-10 shadow-xl shadow-foreground/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  {s.num}
                </div>
                <h3 className="font-heading font-bold text-xl mb-3">
                  {s.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-20">
            <span className="inline-block text-sm font-bold text-primary/90 tracking-wider uppercase px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
              Planos
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mt-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              O plano completo para sua loja
            </h2>
            <p className="text-muted-foreground mt-6 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              Tudo o que você precisa para organizar seu estoque e vender mais.
              Sem letras miúdas.
            </p>
          </div>

          <div className="flex justify-center max-w-2xl mx-auto">
            {/* PRO */}
            <div className="rounded-3xl p-10 relative bg-gradient-to-br from-foreground via-foreground to-foreground/90 text-background shadow-2xl shadow-foreground/20 transition-all duration-500 hover:-translate-y-2 hover:shadow-3xl hover:shadow-foreground/30 border border-background/10 w-full">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-foreground text-xs font-bold px-5 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
                <Sparkles className="w-4 h-4" />
                MELHOR CUSTO-BENEFÍCIO
              </div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-heading font-bold text-2xl">Stokk Pro</h3>
                  <p className="text-sm text-background/70 mt-1">
                    Para quem quer crescer de verdade
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-heading font-bold tracking-tight">
                    R$ 89
                  </span>
                  <span className="text-base text-background/70">,90 /mês</span>
                </div>
                <p className="text-sm text-background/80 mt-2 font-medium">
                  Nos primeiros 3 meses, depois apenas R$ 120,00/mês
                </p>
              </div>
              <ul className="mt-10 space-y-4">
                {proFeatures.map((f) => (
                  <li
                    key={f.text}
                    className="flex items-center gap-3 text-sm font-medium"
                  >
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                    {f.text}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full mt-10 rounded-full h-14 bg-background text-foreground hover:bg-background/95 text-base font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                variant="secondary"
                onClick={() => navigate("/login")}
              >
                Assinar agora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <p className="text-xs text-background/60 text-center mt-4">
                Cancele quando quiser. Sem taxas ocultas.
              </p>
            </div>
          </div>

          <p className="text-center text-base text-muted-foreground mt-12">
            Sem fidelidade. Sem taxa de adesão. Sem surpresas.{" "}
            <span className="font-bold text-foreground">
              Sua loja merece mais.
            </span>
          </p>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section id="testimonials" className="py-28 px-6 bg-gradient-to-b from-muted/30 via-muted/50 to-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[length:24px_24px] pointer-events-none opacity-50" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-20">
            <span className="inline-block text-sm font-bold text-primary/90 tracking-wider uppercase px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
              Depoimentos
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mt-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Quem usa, recomenda
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                className="glass-card rounded-3xl p-8 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-2 border-2 border-transparent hover:border-primary/10 backdrop-blur-xl"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-base text-muted-foreground leading-relaxed italic">
                  "{t.text}"
                </p>
                <div className="mt-8 pt-6 border-t border-border/50 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-sm font-bold text-primary shadow-lg">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-base">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-[2rem] bg-gradient-to-br from-foreground via-foreground to-foreground/90 text-background p-16 md:p-20 text-center overflow-hidden border border-background/10 shadow-2xl">
            {/* CTA background decorations */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/3 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-background/10 backdrop-blur-sm mb-8">
                <Zap className="w-10 h-10 text-background animate-pulse" />
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight">
                Pronto para ter controle total?
              </h2>
              <p className="text-background/80 mt-6 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                Comece a usar o Stokk agora e transforme a gestão do seu estoque
                de moda.
              </p>
              <Button
                size="lg"
                onClick={() => navigate("/login")}
                className="mt-10 gap-2 text-base px-12 rounded-full h-16 bg-background text-foreground hover:bg-background/95 shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 font-bold"
              >
                Acessar minha conta
                <ArrowRight className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-border/50 py-16 px-6 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <img src={logo} alt="Stokk" className="w-10 h-10 rounded-xl shadow-sm" />
                <span className="font-heading font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">Stokk</span>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed max-w-md">
                Plataforma completa de gestão de estoque para lojas de moda.
                Controle grades, vendas e cresça com inteligência.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-heading font-bold text-base mb-5">
                Produto
              </h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#features"
                    className="hover:text-foreground transition-colors hover:translate-x-1 inline-block"
                  >
                    Recursos
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-foreground transition-colors hover:translate-x-1 inline-block"
                  >
                    Planos
                  </a>
                </li>
                <li>
                  <a
                    href="#testimonials"
                    className="hover:text-foreground transition-colors hover:translate-x-1 inline-block"
                  >
                    Depoimentos
                  </a>
                </li>
              </ul>
            </div>

            {/* Developer */}
            <div>
              <h4 className="font-heading font-bold text-base mb-5">
                Contato
              </h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Instagram className="w-5 h-5 shrink-0" />
                  <a
                    href="https://instagram.com/kode.devbr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors hover:underline"
                  >
                    @kode.devbr
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 shrink-0" />
                  <a
                    href="mailto:kode.dev.br@gmail.com"
                    className="hover:text-foreground transition-colors hover:underline break-all"
                  >
                    kode.dev.br@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-10 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Stokk — Todos os direitos reservados.
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              Feito com <span className="text-red-500 animate-pulse text-base">♥</span> para sua loja
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
