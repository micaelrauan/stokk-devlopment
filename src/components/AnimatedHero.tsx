import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AnimatedHeroProps {
  frameCount: number;
  basePath: string;
  fileNamePrefix: string;
  extension: string;
}

export const AnimatedHero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative w-full pt-32 pb-24 md:pt-48 md:pb-52 px-6 bg-white overflow-hidden flex flex-col items-center justify-center text-center">
      {/* Subtle Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[60%] h-[40%] bg-primary/[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10 font-body flex flex-col items-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100/80 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500/90">
            Modern Inventory Standard
          </span>
        </div>
        
        {/* Centered Heading */}
        <h1 className="text-5xl md:text-7xl xl:text-[90px] font-bold tracking-[-0.04em] leading-[0.92] text-slate-900 mb-8 font-heading animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
          Gerencie sua loja <br />
          <span className="text-primary/90">sem esforço.</span>
        </h1>
        
        {/* Centered Description */}
        <p className="text-slate-500 text-lg md:text-xl max-w-2xl leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
          O Stokk combina design intuitivo e tecnologia de ponta para 
          transformar seu controle de estoque em uma experiência fluida, rápida e totalmente organizada.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-5 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
          <Button 
            size="lg" 
            className="w-full sm:w-auto rounded-full px-12 h-16 text-base font-bold shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-0.5 transition-all duration-300 bg-slate-900 text-white"
            onClick={() => navigate("/login")}
          >
            Começar Agora
            <ArrowRight className="w-5 h-5 ml-2.5 opacity-70" />
          </Button>
          <Button 
            variant="ghost" 
            size="lg" 
            className="w-full sm:w-auto rounded-full px-10 h-16 text-base font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all duration-300"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Ver Recursos
          </Button>
        </div>

        {/* Stats Section with Centered layout */}
        <div className="mt-24 pt-10 border-t border-slate-100/60 flex items-center justify-center gap-16 animate-in fade-in duration-1000 delay-700 w-full">
          <div className="space-y-1">
            <p className="text-3xl font-bold text-slate-900 tracking-tighter">120+</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold text-center">Lojistas Ativos</p>
          </div>
          <div className="w-px h-12 bg-slate-100/80" />
          <div className="space-y-1">
            <p className="text-3xl font-bold text-slate-900 tracking-tighter">99.9%</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold text-center">Uptime Garantido</p>
          </div>
          <div className="w-px h-12 bg-slate-100/80 hidden sm:block" />
          <div className="space-y-1 hidden sm:block">
            <p className="text-3xl font-bold text-slate-900 tracking-tighter">24/7</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold text-center">Suporte Premium</p>
          </div>
        </div>
      </div>
    </section>
  );
};
