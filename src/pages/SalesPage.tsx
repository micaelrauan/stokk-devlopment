import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useInventoryContext } from "@/contexts/InventoryContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ScanBarcode,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CheckCircle,
  Banknote,
  CreditCard,
  Smartphone,
  Search,
  X,
  Package,
  ChevronDown,
  User,
  Percent,
  Eye,
} from "lucide-react";
import { Product, ProductVariant, SaleItem } from "@/types/inventory";
import ProductDetailsDialog from "@/components/ProductDetailsDialog";

interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

type PaymentMethod = "cash" | "card" | "pix";

export default function SalesPage() {
  const { findByBarcode, registerSale, products, todaySales, todayRevenue } =
    useInventoryContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [showDiscount, setShowDiscount] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [showCustomer, setShowCustomer] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [expandedProductId, setExpandedProductId] = useState<string | null>(
    null,
  );
  const [paymentMode, setPaymentMode] = useState<PaymentMethod | null>(null);
  const [cashReceived, setCashReceived] = useState("");
  const [success, setSuccess] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [scanFeedback, setScanFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const productSearchRef = useRef<HTMLInputElement>(null);
  const cashInputRef = useRef<HTMLInputElement>(null);

  // Refs for stable keyboard handler — avoids stale closures
  const startPaymentRef = useRef<(method: PaymentMethod) => void>(() => {});
  const handleFinalizeSaleRef = useRef<(method: PaymentMethod) => void>(
    () => {},
  );

  // Focus scanner on mount
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Keyboard shortcuts — uses refs so dependencies don't change
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs (except dedicated shortcuts)
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      if (e.key === "Escape") {
        e.preventDefault();
        if (paymentMode) {
          setPaymentMode(null);
          setCashReceived("");
        } else {
          setShowProducts(false);
          setShowCustomer(false);
          setShowDiscount(false);
        }
        searchRef.current?.focus();
        return;
      }

      if (isInput) return;

      // F1=Cash, F2=Card, F3=Pix — only when cart has items
      if (cart.length > 0) {
        if (e.key === "F1") {
          e.preventDefault();
          startPaymentRef.current("cash");
          return;
        }
        if (e.key === "F2") {
          e.preventDefault();
          handleFinalizeSaleRef.current("card");
          return;
        }
        if (e.key === "F3") {
          e.preventDefault();
          handleFinalizeSaleRef.current("pix");
          return;
        }
      }

      // Focus search on any letter/number key when not in input
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [paymentMode, cart.length]);

  const addToCart = useCallback((product: Product, variant: ProductVariant) => {
    setCart((prev) => {
      const existing = prev.findIndex((i) => i.variant.id === variant.id);
      if (existing >= 0) {
        return prev.map((item, i) =>
          i === existing
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, variant.currentStock),
              }
            : item,
        );
      }
      return [...prev, { product, variant, quantity: 1 }];
    });
    setScanFeedback({
      ok: true,
      text: `${product.name} — ${variant.color} ${variant.size}`,
    });
    setTimeout(() => setScanFeedback(null), 2000);
    setSearchQuery("");
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    const q = searchQuery.trim();
    if (!q) return;

    const found = findByBarcode(q);
    if (found) {
      addToCart(found.product, found.variant);
      searchRef.current?.focus();
      return;
    }

    const matchedProduct = products.find(
      (p) =>
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.reference.toLowerCase().includes(q.toLowerCase()) ||
        p.variants.some((v) => v.sku.toLowerCase().includes(q.toLowerCase())),
    );
    if (matchedProduct) {
      const availableVariant = matchedProduct.variants.find(
        (v) => v.currentStock > 0,
      );
      if (availableVariant) {
        addToCart(matchedProduct, availableVariant);
        searchRef.current?.focus();
        return;
      }
    }

    setScanFeedback({ ok: false, text: `"${q}" não encontrado` });
    setTimeout(() => setScanFeedback(null), 2000);
    setSearchQuery("");
  };

  const updateQuantity = (variantId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.variant.id !== variantId) return item;
        const newQty = Math.max(
          1,
          Math.min(item.quantity + delta, item.variant.currentStock),
        );
        return { ...item, quantity: newQty };
      }),
    );
  };

  const removeItem = (variantId: string) => {
    setCart((prev) => prev.filter((i) => i.variant.id !== variantId));
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.salePrice * item.quantity,
    0,
  );
  const discountValue = subtotal * (discount / 100);
  const total = subtotal - discountValue;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const startPayment = (method: PaymentMethod) => {
    if (method === "cash") {
      setPaymentMode("cash");
      setCashReceived("");
      setTimeout(() => cashInputRef.current?.focus(), 50);
    } else {
      handleFinalizeSale(method);
    }
  };

  const handleFinalizeSale = useCallback(
    (method: PaymentMethod) => {
      if (cart.length === 0) return;
      if (method === "cash" && (!cashReceived || Number(cashReceived) < total))
        return;

      const saleItems: SaleItem[] = cart.map((item) => ({
        variantId: item.variant.id,
        productId: item.product.id,
        productName: item.product.name,
        variantLabel: `${item.variant.color} ${item.variant.size}`,
        sku: item.variant.sku,
        quantity: item.quantity,
        unitPrice: item.product.salePrice,
      }));

      registerSale({
        items: saleItems,
        subtotal,
        discount,
        total,
        paymentMethod: method,
        cashReceived: method === "cash" ? Number(cashReceived) : undefined,
        change: method === "cash" ? Number(cashReceived) - total : undefined,
        customerName: customerName || undefined,
      });

      setCart([]);
      setDiscount(0);
      setShowDiscount(false);
      setCustomerName("");
      setShowCustomer(false);
      setPaymentMode(null);
      setCashReceived("");
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        searchRef.current?.focus();
      }, 2000);
    },
    [cart, cashReceived, total, subtotal, discount, customerName, registerSale],
  );

  // Keep refs in sync so keyboard shortcuts always use latest functions
  startPaymentRef.current = startPayment;
  handleFinalizeSaleRef.current = handleFinalizeSale;

  // Product browser
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.reference.toLowerCase().includes(q) ||
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

  // Quick cash amounts
  const suggestedAmounts = useMemo(() => {
    if (total <= 0) return [];
    const amounts = [10, 20, 50, 100, 200].filter((a) => a >= total);
    if (amounts.length === 0)
      return [Math.ceil(total / 50) * 50, Math.ceil(total / 100) * 100];
    return amounts.slice(0, 4);
  }, [total]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header compacto */}
      <div className="flex items-center justify-between pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-heading font-bold">PDV</h1>
          {cart.length > 0 && (
            <Badge variant="secondary" className="font-mono text-xs">
              {totalItems} itens
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            Hoje:{" "}
            <strong className="text-foreground">{todaySales.length}</strong>{" "}
            vendas
          </span>
          <span className="font-mono font-bold text-foreground">
            R$ {todayRevenue.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Scanner + Product picker */}
      <div className="glass-card rounded-xl p-3 shrink-0 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={searchRef}
              placeholder="Bipar código ou digitar nome do produto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pl-9 font-mono h-11 text-base"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  searchRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
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

        {/* Scan feedback */}
        {scanFeedback && (
          <p
            className={`text-xs font-medium animate-fade-in ${scanFeedback.ok ? "text-success" : "text-destructive"}`}
          >
            {scanFeedback.ok ? "✓" : "✗"} {scanFeedback.text}
          </p>
        )}

        {/* Inline product browser */}
        {showProducts && (
          <div className="border-t border-border pt-2 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                ref={productSearchRef}
                placeholder="Buscar produto..."
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
            <ScrollArea className="max-h-[280px]">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-15" />
                  <p className="text-xs">Nenhum produto encontrado</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredProducts.map((product) => {
                    const available = product.variants.filter(
                      (v) => v.currentStock > 0,
                    );
                    if (available.length === 0) return null;
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
                              R$ {product.salePrice.toFixed(2)} ·{" "}
                              {available.length} disp.
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailProduct(product);
                            }}
                            className="p-1 rounded-md hover:bg-muted transition-colors shrink-0"
                            title="Ver detalhes"
                          >
                            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          />
                        </button>
                        {isExpanded && (
                          <div className="border-t border-border/50 bg-muted/20 p-1.5 space-y-0.5">
                            {available.map((variant) => (
                              <button
                                key={variant.id}
                                onClick={() => addToCart(product, variant)}
                                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-background transition-colors text-left group"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">
                                    {variant.color}
                                  </span>
                                  <span className="bg-muted text-muted-foreground px-1.5 py-px rounded text-[11px] font-medium">
                                    {variant.size}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-[11px] font-medium ${variant.currentStock <= 3 ? "text-warning" : "text-muted-foreground"}`}
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

      {/* Cart items */}
      <div className="flex-1 mt-3 glass-card rounded-xl overflow-hidden flex flex-col min-h-0">
        {cart.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <ScanBarcode className="w-12 h-12 mx-auto mb-2 opacity-10" />
              <p className="text-sm font-medium">Escaneie para começar</p>
              <p className="text-[11px] mt-1">
                F1 Dinheiro · F2 Cartão · F3 PIX
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Items header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30 shrink-0">
              <span className="text-xs font-semibold text-muted-foreground">
                ITENS
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCustomer((v) => !v)}
                  className={`p-1 rounded transition-colors ${showCustomer ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
                  title="Cliente"
                >
                  <User className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowDiscount((v) => !v)}
                  className={`p-1 rounded transition-colors ${showDiscount ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
                  title="Desconto"
                >
                  <Percent className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setCart([]);
                    setDiscount(0);
                    setShowDiscount(false);
                    searchRef.current?.focus();
                  }}
                  className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                  title="Limpar carrinho"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Optional fields */}
            {(showCustomer || showDiscount) && (
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-muted/10 shrink-0">
                {showCustomer && (
                  <Input
                    placeholder="Nome do cliente"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-7 text-xs flex-1"
                  />
                )}
                {showDiscount && (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={discount || ""}
                      onChange={(e) =>
                        setDiscount(
                          Math.min(100, Math.max(0, Number(e.target.value))),
                        )
                      }
                      className="w-16 text-right font-mono h-7 text-xs"
                      placeholder="0"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                )}
              </div>
            )}

            {/* Scrollable items */}
            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-border/30">
                {cart.map((item, index) => (
                  <div
                    key={item.variant.id}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 hover:bg-muted/20 transition-colors"
                  >
                    <span className="text-[11px] text-muted-foreground w-4 shrink-0 text-center hidden sm:block">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate leading-tight">
                        {item.product.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.variant.color} · {item.variant.size}
                        <span className="ml-1 font-mono">
                          R$ {item.product.salePrice.toFixed(2)}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.variant.id, -1)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-muted/60 border border-border flex items-center justify-center hover:bg-muted active:scale-95 transition-all"
                      >
                        <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={item.quantity}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "");
                          const val =
                            raw === ""
                              ? 0
                              : Math.min(
                                  parseInt(raw),
                                  item.variant.currentStock,
                                );
                          setCart((prev) =>
                            prev.map((ci) =>
                              ci.variant.id === item.variant.id
                                ? { ...ci, quantity: val }
                                : ci,
                            ),
                          );
                        }}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value);
                          if (!val || val < 1) {
                            setCart((prev) =>
                              prev.map((ci) =>
                                ci.variant.id === item.variant.id
                                  ? { ...ci, quantity: 1 }
                                  : ci,
                              ),
                            );
                          }
                        }}
                        className="w-8 sm:w-10 text-center font-mono font-bold bg-transparent h-7 sm:h-8 text-sm focus:ring-0 border-none"
                      />
                      <button
                        onClick={() => updateQuantity(item.variant.id, 1)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-muted/60 border border-border flex items-center justify-center hover:bg-muted active:scale-95 transition-all"
                      >
                        <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-bold w-16 sm:w-20 text-right font-mono tabular-nums shrink-0 hidden sm:block">
                      R$ {(item.product.salePrice * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeItem(item.variant.id)}
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals strip */}
            <div className="border-t border-border px-4 py-2.5 bg-muted/20 shrink-0">
              {discount > 0 && (
                <div className="flex justify-between text-xs text-destructive mb-1">
                  <span>Desconto {discount}%</span>
                  <span className="font-mono">
                    - R$ {discountValue.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {totalItems} itens
                </span>
                <span className="text-2xl font-bold font-mono tabular-nums">
                  R$ {total.toFixed(2)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom: Payment zone */}
      <div className="shrink-0 mt-3 space-y-2">
        {success && (
          <div className="p-3 rounded-xl bg-success/10 border border-success/30 text-success text-sm font-medium flex items-center gap-2 animate-fade-in">
            <CheckCircle className="w-5 h-5" />
            Venda finalizada com sucesso!
          </div>
        )}

        {!paymentMode ? (
          /* Payment buttons — always visible */
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => startPayment("cash")}
              disabled={cart.length === 0}
              variant="outline"
              className="h-11 sm:h-12 gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold"
            >
              <Banknote className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Dinheiro</span>
              <span className="sm:hidden">Din.</span>
              <span className="text-[10px] opacity-50 ml-0.5 hidden sm:inline">
                F1
              </span>
            </Button>
            <Button
              onClick={() => handleFinalizeSale("card")}
              disabled={cart.length === 0}
              variant="outline"
              className="h-11 sm:h-12 gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold"
            >
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Cartão</span>
              <span className="sm:hidden">Cart.</span>
              <span className="text-[10px] opacity-50 ml-0.5 hidden sm:inline">
                F2
              </span>
            </Button>
            <Button
              onClick={() => handleFinalizeSale("pix")}
              disabled={cart.length === 0}
              variant="outline"
              className="h-11 sm:h-12 gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold"
            >
              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
              PIX
              <span className="text-[10px] opacity-50 ml-0.5 hidden sm:inline">
                F3
              </span>
            </Button>
          </div>
        ) : (
          /* Cash payment flow */
          <div className="glass-card rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">
                Pagamento em Dinheiro — R$ {total.toFixed(2)}
              </span>
              <button
                onClick={() => {
                  setPaymentMode(null);
                  setCashReceived("");
                  searchRef.current?.focus();
                }}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="w-3 h-3" /> ESC
              </button>
            </div>

            {/* Quick amounts */}
            <div className="flex gap-1.5">
              {suggestedAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setCashReceived(String(amt));
                    setTimeout(() => handleFinalizeSale("cash"), 50);
                  }}
                  className="flex-1 py-2 rounded-lg border border-border bg-muted/30 hover:bg-primary hover:text-primary-foreground transition-colors text-sm font-mono font-bold"
                >
                  R$ {amt}
                </button>
              ))}
              <button
                onClick={() => {
                  setCashReceived(String(total));
                  setTimeout(() => handleFinalizeSale("cash"), 50);
                }}
                className="flex-1 py-2 rounded-lg border border-primary/50 bg-primary/5 hover:bg-primary hover:text-primary-foreground transition-colors text-xs font-semibold"
              >
                Exato
              </button>
            </div>

            {/* Manual input */}
            <div className="flex items-center gap-2">
              <Input
                ref={cashInputRef}
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="font-mono text-lg h-12 flex-1"
                placeholder="Valor recebido"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && Number(cashReceived) >= total) {
                    handleFinalizeSale("cash");
                  }
                }}
              />
              <Button
                onClick={() => handleFinalizeSale("cash")}
                disabled={!cashReceived || Number(cashReceived) < total}
                className="h-12 px-6 gap-2 font-bold text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                OK
              </Button>
            </div>

            {Number(cashReceived) >= total && Number(cashReceived) > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/30">
                <span className="text-sm font-medium">Troco</span>
                <span className="text-xl font-bold font-mono text-success">
                  R$ {(Number(cashReceived) - total).toFixed(2)}
                </span>
              </div>
            )}
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
