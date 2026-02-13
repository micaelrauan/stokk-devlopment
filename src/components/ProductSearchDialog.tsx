import { useState, useMemo } from 'react';
import { useInventoryContext } from '@/contexts/InventoryContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Package, Plus } from 'lucide-react';
import { Product, ProductVariant } from '@/types/inventory';

interface ProductSearchDialogProps {
  onSelectVariant: (product: Product, variant: ProductVariant) => void;
  trigger?: React.ReactNode;
}

export default function ProductSearchDialog({ onSelectVariant, trigger }: ProductSearchDialogProps) {
  const { products } = useInventoryContext();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.reference.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.variants.some(v =>
        v.sku.toLowerCase().includes(q) ||
        v.barcode.includes(q) ||
        v.color.toLowerCase().includes(q) ||
        v.size.toLowerCase().includes(q)
      )
    );
  }, [products, search]);

  const handleSelect = (product: Product, variant: ProductVariant) => {
    onSelectVariant(product, variant);
    setOpen(false);
    setSearch('');
    setExpandedProductId(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full gap-2">
            <Search className="w-4 h-4" />
            Buscar Produto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Busca Avançada
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Nome, referência, SKU, cor, tamanho..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        <ScrollArea className="flex-1 min-h-0 max-h-[50vh] pr-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(product => {
                const isExpanded = expandedProductId === product.id;
                return (
                  <div key={product.id} className="rounded-lg border border-border overflow-hidden">
                    <button
                      onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                    >
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-md object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.reference} · {product.brand} · {product.variants.length} variações
                        </p>
                      </div>
                      <span className="text-sm font-bold text-primary">
                        R$ {product.salePrice.toFixed(2)}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border bg-muted/30 p-2 space-y-1">
                        {product.variants.map(variant => (
                          <div
                            key={variant.id}
                            className="flex items-center justify-between p-2 rounded-md hover:bg-background transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">
                                {variant.color} · {variant.size}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">{variant.sku}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-medium ${variant.currentStock <= 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                {variant.currentStock} un.
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => handleSelect(product, variant)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
