import { Button } from "./ui/button";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ModernHero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative w-full min-h-[85vh] flex flex-col items-center justify-center pt-32 pb-20 px-6 overflow-hidden bg-white">
      {/* Dynamic Purple Gradient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-indigo-500/5 to-transparent animate-gradient" />
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" />
        
        {/* Animated grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.05)_1px,transparent_1px)] bg-[length:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10 text-center flex flex-col items-center">
        {/* Premium Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 border border-purple-100 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
          <span className="text-[12px] font-bold uppercase tracking-widest text-purple-700">
            Nova experiência em estoque
          </span>
        </div>

        {/* Main Heading with Animated Gradient Text */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-slate-900 mb-8 leading-[1.05] animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
          Gerencie sua loja <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-800 animate-gradient">
            com inteligência.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-600 text-lg md:text-xl leading-relaxed max-w-2xl mb-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
          Abandone as planilhas. O Stokk é a ferramenta definitiva para lojistas 
          modernos que buscam organização absoluta e crescimento real.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
          <Button 
            size="lg" 
            className="w-full sm:w-auto rounded-2xl px-12 h-16 text-base font-bold shadow-2xl shadow-purple-500/20 hover:shadow-purple-600/30 hover:-translate-y-1 transition-all duration-300 bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => navigate("/login")}
          >
            Acessar minha conta
            <ArrowRight className="w-5 h-5 ml-2.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="lg" 
            className="w-full sm:w-auto rounded-2xl px-10 h-16 text-base font-semibold text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition-all duration-300"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Ver funcionalidades
          </Button>
        </div>

        {/* Social Proof / Stats */}
        <div className="mt-20 flex flex-wrap justify-center gap-10 md:gap-20 animate-in fade-in duration-1000 delay-700 border-t border-slate-100 pt-10 w-full">
          {[
            { label: "Lojistas", value: "+500" },
            { label: "Produtos", value: "50k+" },
            { label: "Crescimento", value: "45%" },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-3xl font-bold text-slate-900">{stat.value}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Decorative Elements */}
      <div className="absolute top-1/4 left-10 md:left-20 animate-float opacity-30 md:opacity-60 hidden sm:block">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-500 rotate-12" />
      </div>
      <div className="absolute bottom-1/4 right-10 md:right-20 animate-float opacity-30 md:opacity-60 hidden sm:block [animation-delay:2s]">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-600" />
      </div>
    </section>
  );
};
