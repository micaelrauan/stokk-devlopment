import { useState } from 'react';
import { useInventoryContext } from '@/contexts/InventoryContext';
import { Search, Plus, ChevronDown, ChevronUp, Trash2, Settings2, Palette, Pencil, Ruler } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import ProductGrid from '@/components/ProductGrid';
import AddProductDialog from '@/components/AddProductDialog';
import EditProductDialog from '@/components/EditProductDialog';
import ManageCategoriesDialog from '@/components/ManageCategoriesDialog';
import ManageColorsDialog from '@/components/ManageColorsDialog';
import ManageSizesDialog from '@/components/ManageSizesDialog';
import { Package } from 'lucide-react';
import { Product } from '@/types/inventory';

type StockFilter = 'all' | 'critical' | 'low' | 'ok' | 'excess';

export default function ProductsPage() {
  const { products, categories, deleteProduct } = useInventoryContext();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [showCategories, setShowCategories] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [showSizes, setShowSizes] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const brands = [...new Set(products.map(p => p.brand))];

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.reference.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesBrand = brandFilter === 'all' || p.brand === brandFilter;
    
    const totalQty = p.variants.reduce((s, v) => s + v.currentStock, 0);
    let matchesStock = true;
    if (stockFilter === 'critical') matchesStock = p.variants.some(v => v.currentStock === 0);
    else if (stockFilter === 'low') matchesStock = p.variants.some(v => v.currentStock > 0 && v.currentStock <= p.minStockThreshold);
    else if (stockFilter === 'ok') matchesStock = totalQty > 0 && !p.variants.some(v => v.currentStock <= p.minStockThreshold);
    else if (stockFilter === 'excess') matchesStock = totalQty > p.variants.length * 20;

    return matchesSearch && matchesCategory && matchesBrand && matchesStock;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Produtos</h1>
          <p className="text-muted-foreground mt-1">Gerencie seu catálogo e grade de estoque</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCategories(true)} variant="outline" className="gap-2">
            <Settings2 className="w-4 h-4" />
            Categorias
          </Button>
          <Button onClick={() => setShowColors(true)} variant="outline" className="gap-2">
            <Palette className="w-4 h-4" />
            Cores
          </Button>
          <Button onClick={() => setShowSizes(true)} variant="outline" className="gap-2">
            <Ruler className="w-4 h-4" />
            Tamanhos
          </Button>
          <Button onClick={() => setShowAdd(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, referência, categoria..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Marca" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Marcas</SelectItem>
            {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={stockFilter} onValueChange={v => setStockFilter(v as StockFilter)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Estoque" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="critical">🔴 Esgotado</SelectItem>
            <SelectItem value="low">🟡 Estoque Baixo</SelectItem>
            <SelectItem value="ok">🟢 Normal</SelectItem>
            <SelectItem value="excess">🔵 Excesso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map(product => {
          const isExpanded = expandedId === product.id;
          const totalQty = product.variants.reduce((s, v) => s + v.currentStock, 0);
          return (
            <div key={product.id} className="glass-card rounded-xl overflow-hidden">
              <div className="w-full p-5 flex items-center justify-between">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : product.id)}
                  className="flex items-center gap-4 min-w-0 flex-1 text-left hover:opacity-80 transition-opacity"
                >
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">{product.reference.split('-')[0]}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{product.name}</h3>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{product.reference}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {product.brand} · {product.category} · R$ {product.salePrice.toFixed(2)} · Mín: {product.minStockThreshold} un.
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={() => setEditProduct(product)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                    totalQty === 0 
                      ? 'bg-destructive/10 text-destructive' 
                      : totalQty <= 10 
                        ? 'bg-warning/10 text-warning' 
                        : 'bg-success/10 text-success'
                  }`}>
                    {totalQty} peças
                  </span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir <strong>{product.name}</strong> ({product.reference})? Esta ação não pode ser desfeita e todas as variações serão removidas.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteProduct(product.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <button onClick={() => setExpandedId(isExpanded ? null : product.id)}>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                  </button>
                </div>
              </div>
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-border">
                  <ProductGrid product={product} />
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">Nenhum produto encontrado</p>
            <p className="text-sm mt-1">Tente ajustar seus filtros ou adicione um novo produto.</p>
          </div>
        )}
      </div>

      <AddProductDialog open={showAdd} onOpenChange={setShowAdd} />
      <ManageCategoriesDialog open={showCategories} onOpenChange={setShowCategories} />
      <ManageColorsDialog open={showColors} onOpenChange={setShowColors} />
      <ManageSizesDialog open={showSizes} onOpenChange={setShowSizes} />
      <EditProductDialog product={editProduct} open={!!editProduct} onOpenChange={open => { if (!open) setEditProduct(null); }} />
    </div>
  );
}
