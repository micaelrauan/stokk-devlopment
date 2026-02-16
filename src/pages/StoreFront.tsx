
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, ShoppingBag, Menu, X, ArrowLeft, Search, Filter, Facebook, Instagram, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string;
  sale_price: number;
  category: string;
  brand: string;
  variants: any[];
}

interface StoreProfile {
  company_name: string;
  slug: string;
  address: string;
  phone: string;
  avatar_url?: string;
}

export default function StoreFront() {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<StoreProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    async function fetchStore() {
        if (!slug) return;
        setLoading(true);

        try {
            // 1. Busca o Profile da Loja pelo SLUG
            const { data: storeData, error: storeError } = await supabase
                .from("profiles")
                .select("*")
                .eq("slug", slug)
                .maybeSingle();

            if (storeError || !storeData) {
                console.error("Loja não encontrada", storeError);
                setLoading(false);
                return;
            }

            setProfile(storeData);

            // 2. Busca OS PRODUTOS desse Profile ID
            const { data: prodData, error: prodError } = await supabase
                .from("products")
                .select(`
                    *,
                    variants:product_variants(*)
                `)
                .eq("user_id", storeData.id); // Usa o ID do dono da loja

            if (prodError) {
                console.error("Erro ao buscar produtos", prodError);
            } else {
                // @ts-ignore
                setProducts(prodData || []);
            }

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    fetchStore();
  }, [slug]);

  // Filtragem local
  const categories = Array.from(new Set(products.map(p => p.category)));
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!profile && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Package className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Loja não encontrada</h1>
        <p className="text-gray-500 mb-6">O endereço da loja parece estar incorreto ou ela não existe mais.</p>
        <Button variant="outline" onClick={() => window.location.href = "/"}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Stokk Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-sm">
                {profile?.company_name?.substring(0, 2).toUpperCase()}
             </div>
             <span className="font-bold text-lg tracking-tight hidden sm:block">
                {profile?.company_name}
             </span>
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden md:flex relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                   placeholder="Buscar produtos..." 
                   className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-all h-9 rounded-full text-sm"
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                />
             </div>

             <Sheet>
               <SheetTrigger asChild>
                 <Button variant="ghost" size="icon" className="relative">
                   <ShoppingBag className="w-5 h-5 text-gray-700" />
                   {cartCount > 0 && (
                     <span className="absolute top-0 right-0 w-4 h-4 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {cartCount}
                     </span>
                   )}
                 </Button>
               </SheetTrigger>
               <SheetContent>
                 <SheetHeader>
                   <SheetTitle>Seu Carrinho</SheetTitle>
                 </SheetHeader>
                 <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                    <ShoppingBag className="w-12 h-12 opacity-20" />
                    <p>Seu carrinho está vazio</p>
                    <Button variant="outline" onClick={() => (document.querySelector('[data-radix-collection-item]') as HTMLElement)?.click()}>
                        Continuar Comprando
                    </Button>
                 </div>
               </SheetContent>
             </Sheet>
          </div>
        </div>
      </header>

      {/* ─── Hero Banner ─── */}
      <div className="relative bg-gray-900 text-white overflow-hidden h-[400px] flex items-center justify-center">
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay" />
         <div className="relative z-10 text-center px-4 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <Badge variant="outline" className="mb-4 text-white border-white/30 backdrop-blur-sm px-4 py-1">
               NOVA COLEÇÃO
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
               {profile?.company_name}
            </h1>
            <p className="text-lg text-white/80 max-w-md mx-auto mb-8 font-light">
               Descubra as últimas tendências e peças exclusivas selecionadas para você.
            </p>
            <Button size="lg" className="rounded-full bg-white text-black hover:bg-white/90 font-bold px-8" onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth'})}>
               Ver Produtos
            </Button>
         </div>
      </div>

      {/* ─── Products Section ─── */}
      <main id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
         <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
               <h2 className="text-2xl font-bold tracking-tight">Nossos Produtos</h2>
               <p className="text-gray-500 text-sm mt-1">{filteredProducts.length} itens disponíveis</p>
            </div>
            
            <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
               <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px] rounded-full border-gray-200">
                     <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <SelectValue placeholder="Categoria" />
                     </div>
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">Todas as Categorias</SelectItem>
                     {categories.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>
         </div>

         {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
               {filteredProducts.map((product) => (
                  <div key={product.id} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 flex flex-col h-full cursor-pointer">
                     <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden">
                        {product.image_url ? (
                           <img 
                              src={product.image_url} 
                              alt={product.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                           />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Package className="w-12 h-12" />
                           </div>
                        )}
                        
                        {/* Grade Overlay on Hover */}
                        <div className="absolute inset-x-0 bottom-0 bg-white/90 backdrop-blur text-xs py-3 px-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex flex-wrap gap-1 justify-center">
                           {product.variants?.map((v, i) => (
                              <span key={i} title={`${v.color} - Estoque: ${v.current_stock}`} className={`px-1.5 py-0.5 rounded border ${v.current_stock > 0 ? "border-gray-300 text-gray-700" : "border-gray-100 text-gray-300 line-through"}`}>
                                 {v.size}
                              </span>
                           )).slice(0, 5)}
                           {(product.variants?.length || 0) > 5 && <span className="text-gray-400 text-[10px] self-center">+mais</span>}
                        </div>
                     </div>

                     <div className="p-4 flex flex-col flex-1">
                        <div className="text-xs text-gray-500 mb-1 font-medium tracking-wide uppercase">{product.category}</div>
                        <h3 className="font-bold text-gray-900 line-clamp-2 mb-2 flex-1 group-hover:underline decoration-1 underline-offset-4">{product.name}</h3>
                        <div className="flex items-center justify-between mt-auto pt-2">
                           <span className="text-lg font-bold text-gray-900">
                              R$ {Number(product.sale_price).toFixed(2).replace('.', ',')}
                           </span>
                           <Button 
                              size="sm" 
                              className="rounded-full h-8 w-8 p-0 bg-black hover:bg-gray-800 text-white shadow-lg shadow-black/20 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0"
                              onClick={() => setCartCount(c => c + 1)}
                           >
                              <ShoppingBag className="w-4 h-4" />
                           </Button>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         ) : (
            <div className="text-center py-20 bg-gray-50 rounded-3xl">
               <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
               <h3 className="text-lg font-bold text-gray-900">Nenhum produto encontrado</h3>
               <p className="text-gray-500">Tente buscar por outro termo ou categoria.</p>
               <Button 
                  variant="link" 
                  onClick={() => { setSearch(""); setCategoryFilter("all"); }}
                  className="mt-2 text-primary font-bold"
               >
                  Limpar Filtros
               </Button>
            </div>
         )}
      </main>

      {/* ─── Footer ─── */}
      <footer className="bg-white border-t border-gray-100 py-12 mt-12">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
               <div className="col-span-1 md:col-span-2">
                  <span className="font-bold text-xl block mb-4">{profile?.company_name}</span>
                  <p className="text-gray-500 text-sm max-w-sm mb-4">
                     Moda com estilo e qualidade. Siga nossas redes sociais para novidades diárias.
                  </p>
                  <div className="flex gap-4">
                     <Button variant="ghost" size="icon" className="rounded-full bg-gray-100 hover:bg-gray-200">
                        <Instagram className="w-5 h-5" />
                     </Button>
                     <Button variant="ghost" size="icon" className="rounded-full bg-gray-100 hover:bg-gray-200">
                        <Facebook className="w-5 h-5" />
                     </Button>
                     <Button variant="ghost" size="icon" className="rounded-full bg-gray-100 hover:bg-gray-200">
                        <Twitter className="w-5 h-5" />
                     </Button>
                  </div>
               </div>
               
               <div>
                  <h4 className="font-bold mb-4">Atendimento</h4>
                  <ul className="space-y-2 text-sm text-gray-500">
                     <li>{profile?.phone || "(00) 0000-0000"}</li>
                     <li>{profile?.address || "Endereço da Loja"}</li>
                     <li>Seg - Sex: 9h às 18h</li>
                  </ul>
               </div>

               <div>
                  <h4 className="font-bold mb-4">Sobre</h4>
                  <ul className="space-y-2 text-sm text-gray-500">
                     <li><a href="#" className="hover:text-black">Quem somos</a></li>
                     <li><a href="#" className="hover:text-black">Política de Privacidade</a></li>
                     <li><a href="#" className="hover:text-black">Termos de Uso</a></li>
                     <li><a href="#" className="hover:text-black">Trocas e Devoluções</a></li>
                  </ul>
               </div>
            </div>
            
            <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-gray-400">
               <p>© {new Date().getFullYear()} {profile?.company_name}. Todos os direitos reservados.</p>
               <div className="flex items-center gap-2 mt-2 md:mt-0">
                  <span>Powered by</span>
                  <span className="font-bold text-black border border-black/10 bg-black/5 px-2 py-0.5 rounded">Stokk</span>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
}
