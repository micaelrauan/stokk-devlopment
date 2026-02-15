import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Product } from "@/types/inventory";
import { Package, Tag, Layers, BarChart3 } from "lucide-react";

interface Props {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProductDetailsDialog({
  product,
  open,
  onOpenChange,
}: Props) {
  if (!product) return null;

  const totalStock = product.variants.reduce((s, v) => s + v.currentStock, 0);
  const uniqueColors = [...new Set(product.variants.map((v) => v.color))];
  const uniqueSizes = [...new Set(product.variants.map((v) => v.size))];
  const margin =
    product.costPrice > 0
      ? (
          ((product.salePrice - product.costPrice) / product.costPrice) *
          100
        ).toFixed(0)
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {/* Image header */}
        {product.imageUrl ? (
          <div className="relative w-full h-48 sm:h-56 bg-muted">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <span className="text-xs font-mono bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded">
                {product.reference}
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full h-32 bg-muted/50 flex items-center justify-center">
            <Package className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}

        <div className="px-5 pb-5 space-y-5">
          {/* Title */}
          <DialogHeader className="pt-1">
            <DialogTitle className="text-xl font-bold leading-tight">
              {product.name}
            </DialogTitle>
            {product.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {product.description}
              </p>
            )}
          </DialogHeader>

          {/* Info tags */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
              <Tag className="w-3 h-3" />
              {product.category}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs bg-muted px-2.5 py-1 rounded-full font-medium text-muted-foreground">
              <Layers className="w-3 h-3" />
              {product.brand}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold ${
                totalStock === 0
                  ? "bg-destructive/10 text-destructive"
                  : totalStock <=
                      product.minStockThreshold * product.variants.length
                    ? "bg-warning/10 text-warning"
                    : "bg-success/10 text-success"
              }`}
            >
              <BarChart3 className="w-3 h-3" />
              {totalStock} un. em estoque
            </span>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                Preço de Venda
              </p>
              <p className="text-lg font-bold mt-0.5">
                R$ {product.salePrice.toFixed(2)}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                Preço de Custo
              </p>
              <p className="text-lg font-bold mt-0.5">
                R$ {product.costPrice.toFixed(2)}
              </p>
            </div>
            {margin && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  Margem
                </p>
                <p className="text-lg font-bold mt-0.5 text-success">
                  {margin}%
                </p>
              </div>
            )}
          </div>

          {/* Variant grid: Color × Size */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Grade de Estoque</h4>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-center text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">
                      Cor
                    </th>
                    {uniqueSizes.map((size) => (
                      <th
                        key={size}
                        className="px-2 py-2 text-xs font-semibold min-w-[48px]"
                      >
                        {size}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-xs font-medium text-muted-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {uniqueColors.map((color) => {
                    const colorVariants = product.variants.filter(
                      (v) => v.color === color,
                    );
                    const colorTotal = colorVariants.reduce(
                      (s, v) => s + v.currentStock,
                      0,
                    );
                    return (
                      <tr
                        key={color}
                        className="border-t border-border/50 hover:bg-muted/20 transition-colors"
                      >
                        <td className="text-left px-3 py-2 font-medium text-sm">
                          {color}
                        </td>
                        {uniqueSizes.map((size) => {
                          const variant = colorVariants.find(
                            (v) => v.size === size,
                          );
                          const stock = variant?.currentStock ?? 0;
                          return (
                            <td key={size} className="px-2 py-2">
                              <span
                                className={`inline-flex items-center justify-center w-8 h-7 rounded text-xs font-bold ${
                                  stock === 0
                                    ? "bg-destructive/10 text-destructive"
                                    : stock <= product.minStockThreshold
                                      ? "bg-warning/10 text-warning"
                                      : "text-foreground"
                                }`}
                              >
                                {variant ? stock : "—"}
                              </span>
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 font-bold text-sm">
                          {colorTotal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border bg-muted/30">
                    <td className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">
                      Total
                    </td>
                    {uniqueSizes.map((size) => {
                      const sizeTotal = product.variants
                        .filter((v) => v.size === size)
                        .reduce((s, v) => s + v.currentStock, 0);
                      return (
                        <td key={size} className="px-2 py-2 text-xs font-bold">
                          {sizeTotal}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 font-bold">{totalStock}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted-foreground pt-1 border-t border-border/50">
            <span>
              Estoque mín:{" "}
              <strong className="text-foreground">
                {product.minStockThreshold} un.
              </strong>
            </span>
            <span>
              Variações:{" "}
              <strong className="text-foreground">
                {product.variants.length}
              </strong>
            </span>
            <span>
              Cores:{" "}
              <strong className="text-foreground">{uniqueColors.length}</strong>
            </span>
            <span>
              Tamanhos:{" "}
              <strong className="text-foreground">{uniqueSizes.length}</strong>
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
