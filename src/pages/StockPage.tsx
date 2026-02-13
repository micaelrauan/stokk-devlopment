import { useState, useMemo } from 'react';
import { useInventoryContext } from '@/contexts/InventoryContext';
import { Search, Package, Filter, ArrowUpDown, Warehouse } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

type SortField = 'name' | 'stock' | 'category' | 'color' | 'size';
type SortDir = 'asc' | 'desc';
type StockStatus = 'all' | 'out' | 'low' | 'ok' | 'excess';

interface FlatVariant {
  productId: string;
  productName: string;
  reference: string;
  category: string;
  brand: string;
  imageUrl: string;
  salePrice: number;
  minStock: number;
  variantId: string;
  color: string;
  size: string;
  sku: string;
  barcode: string;
  currentStock: number;
}

export default function StockPage() {
  const { products, categories, updateVariantStock } = useInventoryContext();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [colorFilter, setColorFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [stockStatus, setStockStatus] = useState<StockStatus>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Flatten all variants into a single list
  const allVariants: FlatVariant[] = useMemo(() => {
    return products.flatMap(p =>
      p.variants.map(v => ({
        productId: p.id,
        productName: p.name,
        reference: p.reference,
        category: p.category,
        brand: p.brand,
        imageUrl: p.imageUrl,
        salePrice: p.salePrice,
        minStock: p.minStockThreshold,
        variantId: v.id,
        color: v.color,
        size: v.size,
        sku: v.sku,
        barcode: v.barcode,
        currentStock: v.currentStock,
      }))
    );
  }, [products]);

  const allColors = useMemo(() => [...new Set(allVariants.map(v => v.color))].sort(), [allVariants]);
  const allSizes = useMemo(() => [...new Set(allVariants.map(v => v.size))], [allVariants]);

  const filtered = useMemo(() => {
    let list = allVariants;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(v =>
        v.productName.toLowerCase().includes(q) ||
        v.reference.toLowerCase().includes(q) ||
        v.sku.toLowerCase().includes(q) ||
        v.barcode.includes(q) ||
        v.color.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== 'all') list = list.filter(v => v.category === categoryFilter);
    if (colorFilter !== 'all') list = list.filter(v => v.color === colorFilter);
    if (sizeFilter !== 'all') list = list.filter(v => v.size === sizeFilter);

    if (stockStatus === 'out') list = list.filter(v => v.currentStock === 0);
    else if (stockStatus === 'low') list = list.filter(v => v.currentStock > 0 && v.currentStock <= v.minStock);
    else if (stockStatus === 'ok') list = list.filter(v => v.currentStock > v.minStock && v.currentStock <= 20);
    else if (stockStatus === 'excess') list = list.filter(v => v.currentStock > 20);

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.productName.localeCompare(b.productName);
      else if (sortField === 'stock') cmp = a.currentStock - b.currentStock;
      else if (sortField === 'category') cmp = a.category.localeCompare(b.category);
      else if (sortField === 'color') cmp = a.color.localeCompare(b.color);
      else if (sortField === 'size') cmp = a.size.localeCompare(b.size);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [allVariants, search, categoryFilter, colorFilter, sizeFilter, stockStatus, sortField, sortDir]);

  const totalPieces = allVariants.reduce((s, v) => s + v.currentStock, 0);
  const outOfStock = allVariants.filter(v => v.currentStock === 0).length;
  const lowStock = allVariants.filter(v => v.currentStock > 0 && v.currentStock <= v.minStock).length;

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const getStockBadge = (v: FlatVariant) => {
    if (v.currentStock === 0) return <Badge variant="destructive" className="text-xs">Esgotado</Badge>;
    if (v.currentStock <= v.minStock) return <Badge className="bg-warning/15 text-warning border-warning/30 text-xs">Baixo</Badge>;
    if (v.currentStock > 20) return <Badge className="bg-blue-500/15 text-blue-500 border-blue-500/30 text-xs">Excesso</Badge>;
    return <Badge className="bg-success/15 text-success border-success/30 text-xs">Normal</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
          <Warehouse className="w-8 h-8 text-primary" />
          Estoque
        </h1>
        <p className="text-muted-foreground mt-1">Visão detalhada de todas as variações em estoque</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{allVariants.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Variações</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-primary">{totalPieces}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Peças</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-destructive">{outOfStock}</p>
          <p className="text-xs text-muted-foreground mt-1">Esgotados</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-warning">{lowStock}</p>
          <p className="text-xs text-muted-foreground mt-1">Estoque Baixo</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, referência, SKU, código de barras..."
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
        <Select value={colorFilter} onValueChange={setColorFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Cor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Cores</SelectItem>
            {allColors.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sizeFilter} onValueChange={setSizeFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Tamanho" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Tam.</SelectItem>
            {allSizes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={stockStatus} onValueChange={v => setStockStatus(v as StockStatus)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="out">🔴 Esgotado</SelectItem>
            <SelectItem value="low">🟡 Estoque Baixo</SelectItem>
            <SelectItem value="ok">🟢 Normal</SelectItem>
            <SelectItem value="excess">🔵 Excesso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4">
                  <button onClick={() => toggleSort('name')} className="flex items-center gap-1 font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    Produto <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left py-3 px-4">
                  <button onClick={() => toggleSort('category')} className="flex items-center gap-1 font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    Categoria <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left py-3 px-4">
                  <button onClick={() => toggleSort('color')} className="flex items-center gap-1 font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    Cor <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-center py-3 px-4">
                  <button onClick={() => toggleSort('size')} className="flex items-center gap-1 font-semibold text-muted-foreground hover:text-foreground transition-colors mx-auto">
                    Tamanho <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">SKU</th>
                <th className="text-center py-3 px-4">
                  <button onClick={() => toggleSort('stock')} className="flex items-center gap-1 font-semibold text-muted-foreground hover:text-foreground transition-colors mx-auto">
                    Qtd <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.variantId} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {v.imageUrl ? (
                        <img src={v.imageUrl} alt={v.productName} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate">{v.productName}</p>
                        <p className="text-xs text-muted-foreground">{v.reference}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{v.category}</td>
                  <td className="py-3 px-4">{v.color}</td>
                  <td className="text-center py-3 px-4">
                    <span className="bg-muted px-2 py-0.5 rounded-full text-xs font-medium">{v.size}</span>
                  </td>
                  <td className="text-center py-3 px-4 font-mono text-xs text-muted-foreground">{v.sku}</td>
                  <td className="text-center py-3 px-4">
                    <input
                      type="number"
                      min={0}
                      value={v.currentStock}
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val >= 0) {
                          updateVariantStock(v.productId, v.variantId, val);
                        }
                      }}
                      className={`w-16 text-center font-mono font-bold bg-card border border-border rounded h-8 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        v.currentStock === 0
                          ? 'text-destructive'
                          : v.currentStock <= v.minStock
                            ? 'text-warning'
                            : 'text-foreground'
                      }`}
                    />
                  </td>
                  <td className="text-center py-3 px-4">{getStockBadge(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">Nenhuma variação encontrada</p>
            <p className="text-sm mt-1">Tente ajustar seus filtros.</p>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-border bg-muted/20 text-sm text-muted-foreground flex justify-between">
            <span>{filtered.length} variação(ões) exibida(s)</span>
            <span>Total: <strong className="text-foreground">{filtered.reduce((s, v) => s + v.currentStock, 0)}</strong> peças</span>
          </div>
        )}
      </div>
    </div>
  );
}
