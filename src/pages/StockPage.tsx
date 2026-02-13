import { useState, useMemo, useCallback } from "react";
import { useInventoryContext } from "@/contexts/InventoryContext";
import {
  Search,
  Package,
  ArrowUpDown,
  Warehouse,
  X,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ProductDetailsDialog from "@/components/ProductDetailsDialog";
import { Product } from "@/types/inventory";

type SortField = "name" | "stock" | "category" | "color" | "size";
type SortDir = "asc" | "desc";
type StockStatus = "all" | "out" | "low" | "ok" | "excess";

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
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [colorFilter, setColorFilter] = useState("all");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [stockStatus, setStockStatus] = useState<StockStatus>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showFilters, setShowFilters] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const allVariants: FlatVariant[] = useMemo(() => {
    return products.flatMap((p) =>
      p.variants.map((v) => ({
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
      })),
    );
  }, [products]);

  const allColors = useMemo(
    () => [...new Set(allVariants.map((v) => v.color))].sort(),
    [allVariants],
  );
  const allSizes = useMemo(
    () => [...new Set(allVariants.map((v) => v.size))],
    [allVariants],
  );

  const hasActiveFilters =
    categoryFilter !== "all" ||
    colorFilter !== "all" ||
    sizeFilter !== "all" ||
    stockStatus !== "all";
  const activeFilterCount = [
    categoryFilter,
    colorFilter,
    sizeFilter,
    stockStatus,
  ].filter((f) => f !== "all").length;

  const clearFilters = useCallback(() => {
    setCategoryFilter("all");
    setColorFilter("all");
    setSizeFilter("all");
    setStockStatus("all");
  }, []);

  const filtered = useMemo(() => {
    let list = allVariants;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (v) =>
          v.productName.toLowerCase().includes(q) ||
          v.reference.toLowerCase().includes(q) ||
          v.sku.toLowerCase().includes(q) ||
          v.barcode.includes(q) ||
          v.color.toLowerCase().includes(q),
      );
    }
    if (categoryFilter !== "all")
      list = list.filter((v) => v.category === categoryFilter);
    if (colorFilter !== "all")
      list = list.filter((v) => v.color === colorFilter);
    if (sizeFilter !== "all") list = list.filter((v) => v.size === sizeFilter);
    if (stockStatus === "out") list = list.filter((v) => v.currentStock === 0);
    else if (stockStatus === "low")
      list = list.filter(
        (v) => v.currentStock > 0 && v.currentStock <= v.minStock,
      );
    else if (stockStatus === "ok")
      list = list.filter(
        (v) => v.currentStock > v.minStock && v.currentStock <= 20,
      );
    else if (stockStatus === "excess")
      list = list.filter((v) => v.currentStock > 20);

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === "name")
        cmp = a.productName.localeCompare(b.productName);
      else if (sortField === "stock") cmp = a.currentStock - b.currentStock;
      else if (sortField === "category")
        cmp = a.category.localeCompare(b.category);
      else if (sortField === "color") cmp = a.color.localeCompare(b.color);
      else if (sortField === "size") cmp = a.size.localeCompare(b.size);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [
    allVariants,
    search,
    categoryFilter,
    colorFilter,
    sizeFilter,
    stockStatus,
    sortField,
    sortDir,
  ]);

  const totalPieces = allVariants.reduce((s, v) => s + v.currentStock, 0);
  const outOfStock = allVariants.filter((v) => v.currentStock === 0).length;
  const lowStock = allVariants.filter(
    (v) => v.currentStock > 0 && v.currentStock <= v.minStock,
  ).length;

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const getStockBadge = (v: FlatVariant) => {
    if (v.currentStock === 0)
      return (
        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
          Esgotado
        </Badge>
      );
    if (v.currentStock <= v.minStock)
      return (
        <Badge className="bg-warning/15 text-warning border-warning/30 text-[10px] px-1.5 py-0">
          Baixo
        </Badge>
      );
    return (
      <Badge className="bg-success/15 text-success border-success/30 text-[10px] px-1.5 py-0">
        OK
      </Badge>
    );
  };

  // Quick status filter buttons
  const statusTabs: {
    key: StockStatus;
    label: string;
    count: number;
    color: string;
  }[] = [
    { key: "all", label: "Todos", count: allVariants.length, color: "" },
    {
      key: "out",
      label: "Esgotado",
      count: outOfStock,
      color: "text-destructive",
    },
    { key: "low", label: "Baixo", count: lowStock, color: "text-warning" },
    {
      key: "ok",
      label: "Normal",
      count: allVariants.filter(
        (v) => v.currentStock > v.minStock && v.currentStock <= 20,
      ).length,
      color: "text-success",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header compacto + busca inline */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <Warehouse className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-heading font-bold">Estoque</h1>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
            {totalPieces} peças
          </span>
        </div>
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nome, SKU, código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="sm"
            className="h-9 gap-1.5 shrink-0"
            onClick={() => setShowFilters((f) => !f)}
          >
            <Filter className="w-3.5 h-3.5" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Status tabs rápidos */}
      <div className="flex items-center gap-1">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStockStatus(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              stockStatus === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span className={stockStatus !== tab.key ? tab.color : ""}>
              {tab.label}
            </span>
            <span className="ml-1.5 opacity-70">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Filtros avançados (colapsável) */}
      {showFilters && (
        <div className="glass-card rounded-lg p-3 flex flex-wrap items-center gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={colorFilter} onValueChange={setColorFilter}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="Cor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Cores</SelectItem>
              {allColors.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sizeFilter} onValueChange={setSizeFilter}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue placeholder="Tamanho" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {allSizes.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 ml-1"
            >
              <X className="w-3 h-3" /> Limpar
            </button>
          )}
        </div>
      )}

      {/* Tabela otimizada */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {[
                  {
                    field: "name" as SortField,
                    label: "Produto",
                    align: "text-left",
                  },
                  {
                    field: "color" as SortField,
                    label: "Cor/Tam",
                    align: "text-left",
                  },
                  {
                    field: "stock" as SortField,
                    label: "Qtd",
                    align: "text-center",
                  },
                  {
                    field: "category" as SortField,
                    label: "Status",
                    align: "text-center",
                  },
                ].map((col) => (
                  <th key={col.field} className={`${col.align} py-2.5 px-3`}>
                    <button
                      onClick={() => toggleSort(col.field)}
                      className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {col.label}
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr
                  key={v.variantId}
                  className={`border-b border-border/30 transition-colors ${
                    v.currentStock === 0
                      ? "bg-destructive/[0.03]"
                      : "hover:bg-muted/20"
                  }`}
                >
                  {/* Produto */}
                  <td className="py-2 px-3">
                    <div
                      className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => {
                        const p = products.find((p) => p.id === v.productId);
                        if (p) setDetailProduct(p);
                      }}
                    >
                      {v.imageUrl ? (
                        <img
                          src={v.imageUrl}
                          alt=""
                          className="w-8 h-8 rounded-md object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <Package className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate leading-tight">
                          {v.productName}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {v.sku}
                        </p>
                      </div>
                    </div>
                  </td>
                  {/* Cor + Tamanho juntos */}
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{v.color}</span>
                      <span className="bg-muted text-muted-foreground px-1.5 py-px rounded text-[11px] font-medium">
                        {v.size}
                      </span>
                    </div>
                  </td>
                  {/* Quantidade editável */}
                  <td className="py-2 px-3 text-center">
                    <input
                      type="number"
                      min={0}
                      value={v.currentStock}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val >= 0)
                          updateVariantStock(v.productId, v.variantId, val);
                      }}
                      className={`w-14 text-center font-mono font-bold bg-transparent border border-border rounded-md h-8 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        v.currentStock === 0
                          ? "text-destructive border-destructive/30"
                          : v.currentStock <= v.minStock
                            ? "text-warning border-warning/30"
                            : "text-foreground"
                      }`}
                    />
                  </td>
                  {/* Status */}
                  <td className="py-2 px-3 text-center">{getStockBadge(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Nenhuma variação encontrada</p>
            <p className="text-xs mt-1">Tente ajustar os filtros</p>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="px-3 py-2 border-t border-border bg-muted/20 text-xs text-muted-foreground flex justify-between">
            <span>{filtered.length} variações</span>
            <span>
              {filtered.reduce((s, v) => s + v.currentStock, 0)} peças
            </span>
          </div>
        )}
      </div>
      <ProductDetailsDialog
        product={detailProduct}
        open={!!detailProduct}
        onOpenChange={(open) => {
          if (!open) setDetailProduct(null);
        }}
      />
    </div>
  );
}
