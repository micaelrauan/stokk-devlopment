import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useInventoryContext } from "@/contexts/InventoryContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ScanBarcode,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Settings2,
  Search,
  AlertCircle,
  Package,
  ChevronDown,
  X,
} from "lucide-react";
import { ProductVariant, Product } from "@/types/inventory";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ScannedItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

export default function OperationsPage() {
  const { findByBarcode, processOperation, inventoryLogs, products } =
    useInventoryContext();
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [operationType, setOperationType] = useState<"OUT" | "IN" | "ADJUST">(
    "OUT",
  );
  const [reason, setReason] = useState("");
  const [success, setSuccess] = useState(false);
  const [scanError, setScanError] = useState(false);
  const [lastScanned, setLastScanned] = useState("");
  const [showProducts, setShowProducts] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [expandedProductId, setExpandedProductId] = useState<string | null>(
    null,
  );
  const [shouldFocusScanner, setShouldFocusScanner] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const productSearchRef = useRef<HTMLInputElement>(null);

  // Only focus scanner when explicitly requested (scan, add, finalize)
  useEffect(() => {
    if (shouldFocusScanner) {
      inputRef.current?.focus({ preventScroll: true });
      setShouldFocusScanner(false);
    }
  }, [shouldFocusScanner]);
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.reference.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.variants.some(
          (v) =>
            v.sku.toLowerCase().includes(q) ||
            v.barcode.includes(q) ||
            v.color.toLowerCase().includes(q) ||
            v.size.toLowerCase().includes(q),
        ),
    );
  }, [products, productSearch]);

  const addVariant = useCallback(
    (product: Product, variant: ProductVariant) => {
      setScannedItems((prev) => {
        const existing = prev.findIndex((i) => i.variant.id === variant.id);
        if (existing >= 0) {
          return prev.map((item, i) =>
            i === existing ? { ...item, quantity: item.quantity + 1 } : item,
          );
        }
        return [...prev, { product, variant, quantity: 1 }];
      });
      setLastScanned(`${product.name} — ${variant.color} ${variant.size}`);
      setScanError(false);
    },
    [],
  );

  const handleScan = useCallback(
    (code: string) => {
      if (!code.trim()) return;
      const found = findByBarcode(code.trim());
      if (!found) {
        setScanError(true);
        setLastScanned(code.trim());
        setBarcodeInput("");
        setShouldFocusScanner(true);
        setTimeout(() => setScanError(false), 2000);
        return;
      }
      addVariant(found.product, found.variant);
      setBarcodeInput("");
      setShouldFocusScanner(true);
    },
    [findByBarcode, addVariant],
  );

  const updateQuantity = (variantId: string, delta: number) => {
    setScannedItems((prev) =>
      prev.map((item) =>
        item.variant.id === variantId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item,
      ),
    );
  };

  const removeItem = (variantId: string) => {
    setScannedItems((prev) => prev.filter((i) => i.variant.id !== variantId));
  };

  const handleFinalize = useCallback(() => {
    if (scannedItems.length === 0) return;
    const items = scannedItems.map((i) => ({
      productId: i.product.id,
      variantId: i.variant.id,
      quantity: i.quantity,
    }));
    const defaultReasons = {
      OUT: "Venda",
      IN: "Entrada de Fornecedor",
      ADJUST: "Ajuste de Inventário",
    };
    processOperation(
      items,
      operationType,
      reason || defaultReasons[operationType],
    );
    setScannedItems([]);
    setReason("");
    setSuccess(true);
    setShouldFocusScanner(true);
    setTimeout(() => setSuccess(false), 3000);
  }, [scannedItems, operationType, reason, processOperation]);

  // Keyboard shortcut: Ctrl+Enter to finalize
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleFinalize();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleFinalize]);

  const typeButtons: {
    key: "OUT" | "IN" | "ADJUST";
    label: string;
    shortLabel: string;
    icon: typeof ArrowUpFromLine;
    color: string;
    bg: string;
  }[] = [
    {
      key: "OUT",
      label: "Saída",
      shortLabel: "Saída",
      icon: ArrowUpFromLine,
      color: "text-destructive",
      bg: "bg-destructive/10 border-destructive/30",
    },
    {
      key: "IN",
      label: "Entrada",
      shortLabel: "Entrada",
      icon: ArrowDownToLine,
      color: "text-success",
      bg: "bg-success/10 border-success/30",
    },
    {
      key: "ADJUST",
      label: "Ajuste",
      shortLabel: "Ajuste",
      icon: Settings2,
      color: "text-blue-500",
      bg: "bg-blue-500/10 border-blue-500/30",
    },
  ];

  const totalQty = scannedItems.reduce((s, i) => s + i.quantity, 0);
  const totalValue = scannedItems.reduce(
    (s, i) => s + i.product.salePrice * i.quantity,
    0,
  );

  const recentLogs = inventoryLogs.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Top bar: Operation type toggle + title */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <ScanBarcode className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-heading font-bold">Operações</h1>
        </div>
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          {typeButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setOperationType(btn.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                operationType === btn.key
                  ? `${btn.bg} border ${btn.color}`
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <btn.icon className="w-3.5 h-3.5" />
              {btn.shortLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Scanner + Product picker zone */}
      <div className="glass-card rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Bipe ou digite o código de barras..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan(barcodeInput)}
              className="pl-9 font-mono h-11 text-base"
              autoFocus
            />
          </div>
          <Button
            variant={showProducts ? "secondary" : "outline"}
            className="h-11 gap-2 shrink-0"
            onClick={() => {
              setShowProducts((v) => !v);
              if (!showProducts)
                setTimeout(() => productSearchRef.current?.focus(), 100);
            }}
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Produtos</span>
          </Button>
        </div>
        {/* Scan feedback inline */}
        {scanError && (
          <div className="flex items-center gap-1.5 text-destructive text-xs font-medium animate-fade-in">
            <AlertCircle className="w-3.5 h-3.5" />
            Código "{lastScanned}" não encontrado
          </div>
        )}
        {!scanError && lastScanned && scannedItems.length > 0 && (
          <p className="text-xs text-success font-medium animate-fade-in">
            ✓ {lastScanned}
          </p>
        )}

        {/* Inline product browser */}
        {showProducts && (
          <div className="border-t border-border pt-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                ref={productSearchRef}
                placeholder="Buscar produto por nome, cor, SKU..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
              {productSearch && (
                <button
                  onClick={() => setProductSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <ScrollArea className="max-h-[300px]">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-15" />
                  <p className="text-xs">Nenhum produto encontrado</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredProducts.map((product) => {
                    const isExpanded = expandedProductId === product.id;
                    return (
                      <div
                        key={product.id}
                        className="rounded-lg border border-border/60 overflow-hidden"
                      >
                        <button
                          onClick={() =>
                            setExpandedProductId(isExpanded ? null : product.id)
                          }
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 transition-colors text-left"
                        >
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt=""
                              className="w-8 h-8 rounded-md object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                              <Package className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {product.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {product.category} · {product.variants.length}{" "}
                              var.
                            </p>
                          </div>
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {isExpanded && (
                          <div className="border-t border-border/50 bg-muted/20 p-1.5 space-y-0.5">
                            {product.variants.map((variant) => (
                              <button
                                key={variant.id}
                                onClick={() => {
                                  addVariant(product, variant);
                                }}
                                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-background transition-colors text-left group"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-sm">
                                    {variant.color}
                                  </span>
                                  <span className="bg-muted text-muted-foreground px-1.5 py-px rounded text-[11px] font-medium">
                                    {variant.size}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-[11px] font-medium ${
                                      variant.currentStock === 0
                                        ? "text-destructive"
                                        : variant.currentStock <= 3
                                          ? "text-warning"
                                          : "text-muted-foreground"
                                    }`}
                                  >
                                    {variant.currentStock} un.
                                  </span>
                                  <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus className="w-3.5 h-3.5" />
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Items list + finalize */}
      <div className="glass-card rounded-xl overflow-hidden">
        {/* Header strip with count */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
          <span className="text-sm font-semibold">Itens</span>
          {scannedItems.length > 0 && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{scannedItems.length} itens</span>
              <span className="font-mono font-bold text-foreground">
                {totalQty} peças
              </span>
              {operationType !== "ADJUST" && (
                <span className="font-mono font-bold text-foreground">
                  R$ {totalValue.toFixed(2)}
                </span>
              )}
            </div>
          )}
        </div>

        {scannedItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ScanBarcode className="w-10 h-10 mx-auto mb-2 opacity-15" />
            <p className="text-sm">Escaneie um código para começar</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {scannedItems.map((item) => (
              <div
                key={item.variant.id}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors"
              >
                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate leading-tight">
                    {item.product.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {item.variant.color} · {item.variant.size}
                    {item.variant.currentStock <= 3 &&
                      operationType === "OUT" && (
                        <Badge
                          variant="destructive"
                          className="ml-1.5 text-[9px] px-1 py-0"
                        >
                          Est: {item.variant.currentStock}
                        </Badge>
                      )}
                  </p>
                </div>
                {/* Quantity controls — larger touch targets */}
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => updateQuantity(item.variant.id, -1)}
                    className="w-8 h-8 rounded-lg bg-muted/60 border border-border flex items-center justify-center hover:bg-muted active:scale-95 transition-all"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={item.quantity}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      const val = raw === "" ? 0 : parseInt(raw);
                      setScannedItems((prev) =>
                        prev.map((si) =>
                          si.variant.id === item.variant.id
                            ? { ...si, quantity: val }
                            : si,
                        ),
                      );
                    }}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value);
                      if (!val || val < 1) {
                        setScannedItems((prev) =>
                          prev.map((si) =>
                            si.variant.id === item.variant.id
                              ? { ...si, quantity: 1 }
                              : si,
                          ),
                        );
                      }
                    }}
                    className="w-12 text-center font-mono font-bold bg-transparent border-none h-8 text-sm focus:ring-0"
                  />
                  <button
                    onClick={() => updateQuantity(item.variant.id, 1)}
                    className="w-8 h-8 rounded-lg bg-muted/60 border border-border flex items-center justify-center hover:bg-muted active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Value */}
                <span className="text-sm font-bold w-20 text-right font-mono tabular-nums">
                  R$ {(item.product.salePrice * item.quantity).toFixed(2)}
                </span>
                {/* Remove */}
                <button
                  onClick={() => removeItem(item.variant.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Observation + Finalize — sticky bottom */}
        {scannedItems.length > 0 && (
          <div className="border-t border-border p-4 space-y-3 bg-muted/10">
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Observação (opcional) — Ex: Pedido #1234"
              className="h-8 text-xs"
            />
            <Button
              onClick={handleFinalize}
              className="w-full gap-2 h-11 text-sm font-semibold"
              size="lg"
            >
              <CheckCircle className="w-4 h-4" />
              Finalizar{" "}
              {typeButtons.find((b) => b.key === operationType)?.label} —{" "}
              {totalQty} peças
              <span className="text-xs opacity-70 ml-1">(Ctrl+Enter)</span>
            </Button>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="px-4 py-3 bg-success/10 border-t border-success/30 text-success text-sm font-medium flex items-center gap-2 animate-fade-in">
            <CheckCircle className="w-4 h-4" />
            Operação registrada com sucesso!
          </div>
        )}
      </div>

      {/* Recent history — minimal, collapsible */}
      {recentLogs.length > 0 && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-muted/30">
            <span className="text-sm font-semibold">Últimas Operações</span>
          </div>
          <div className="divide-y divide-border/30">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-3 px-4 py-2 text-sm"
              >
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                    log.type === "IN"
                      ? "bg-success/10 text-success"
                      : log.type === "OUT"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-blue-500/10 text-blue-500"
                  }`}
                >
                  {log.type === "IN" ? (
                    <ArrowDownToLine className="w-3 h-3" />
                  ) : log.type === "OUT" ? (
                    <ArrowUpFromLine className="w-3 h-3" />
                  ) : (
                    <Settings2 className="w-3 h-3" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {log.productName} — {log.variantLabel}
                  </p>
                </div>
                <span
                  className={`font-mono font-bold text-xs ${log.quantity > 0 ? "text-success" : "text-destructive"}`}
                >
                  {log.quantity > 0 ? "+" : ""}
                  {log.quantity}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(log.timestamp).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
