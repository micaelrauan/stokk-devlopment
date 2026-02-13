import { Product, SIZES } from '@/types/inventory';
import { useInventoryContext } from '@/contexts/InventoryContext';
import { Minus, Plus } from 'lucide-react';

interface Props {
  product: Product;
}

export default function ProductGrid({ product }: Props) {
  const { updateVariantStock } = useInventoryContext();
  
  const colors = [...new Set(product.variants.map(v => v.color))];
  const sizes = SIZES.filter(s => product.variants.some(v => v.size === s));

  return (
    <div className="pt-4">
      <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Grade de Estoque</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-2 px-3 font-medium text-muted-foreground">Cor</th>
              {sizes.map(size => (
                <th key={size} className="text-center py-2 px-3 font-medium text-muted-foreground">{size}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {colors.map(color => (
              <tr key={color} className="border-t border-border/50">
                <td className="py-2 px-3 font-medium">{color}</td>
                {sizes.map(size => {
                  const variant = product.variants.find(v => v.size === size && v.color === color);
                  if (!variant) return <td key={size} className="text-center py-2 px-3 text-muted-foreground">—</td>;
                  return (
                    <td key={size} className="text-center py-2 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => updateVariantStock(product.id, variant.id, Math.max(0, variant.currentStock - 1))}
                          className="w-6 h-6 rounded bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min={0}
                          value={variant.currentStock}
                          onChange={e => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val >= 0) {
                              updateVariantStock(product.id, variant.id, val);
                            }
                          }}
                          className={`w-12 text-center font-mono font-bold bg-card border border-border rounded h-7 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            variant.currentStock === 0 
                              ? 'text-destructive' 
                              : variant.currentStock <= product.minStockThreshold 
                                ? 'text-warning' 
                                : 'text-foreground'
                          }`}
                        />
                        <button
                          onClick={() => updateVariantStock(product.id, variant.id, variant.currentStock + 1)}
                          className="w-6 h-6 rounded bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
