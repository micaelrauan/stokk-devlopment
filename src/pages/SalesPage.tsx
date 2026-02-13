import { useState, useRef, useEffect, useCallback } from 'react';
import { useInventoryContext } from '@/contexts/InventoryContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ScanBarcode, Plus, Minus, Trash2, ShoppingCart,
  CheckCircle, Banknote, CreditCard, Smartphone,
  Search, X, DollarSign, Hash, Receipt,
} from 'lucide-react';
import { Product, ProductVariant, SaleItem } from '@/types/inventory';

interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

type PaymentMethod = 'cash' | 'card' | 'pix';

export default function SalesPage() {
  const { findByBarcode, registerSale, products, todaySales, todayRevenue } = useInventoryContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [cashReceived, setCashReceived] = useState('');
  const [success, setSuccess] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Auto-focus search
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ESC: cancel payment or clear
      if (e.key === 'Escape') {
        if (showPayment) {
          setShowPayment(false);
          setPaymentMethod(null);
          setCashReceived('');
        } else if (cart.length > 0) {
          setCart([]);
          setDiscount(0);
        }
        searchRef.current?.focus();
        return;
      }
      // F2: open payment
      if (e.key === 'F2' && cart.length > 0) {
        e.preventDefault();
        setShowPayment(true);
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showPayment, cart.length]);

  const addToCart = useCallback((product: Product, variant: ProductVariant) => {
    setCart(prev => {
      const existing = prev.findIndex(i => i.variant.id === variant.id);
      if (existing >= 0) {
        return prev.map((item, i) =>
          i === existing ? { ...item, quantity: Math.min(item.quantity + 1, variant.currentStock) } : item
        );
      }
      return [...prev, { product, variant, quantity: 1 }];
    });
    setSearchQuery('');
    searchRef.current?.focus();
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    const q = searchQuery.trim();
    if (!q) return;

    // Try barcode first
    const found = findByBarcode(q);
    if (found) {
      addToCart(found.product, found.variant);
      return;
    }

    // Try name/sku match — add first available variant
    const matchedProduct = products.find(p =>
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.reference.toLowerCase().includes(q.toLowerCase()) ||
      p.variants.some(v => v.sku.toLowerCase().includes(q.toLowerCase()))
    );
    if (matchedProduct) {
      const availableVariant = matchedProduct.variants.find(v => v.currentStock > 0);
      if (availableVariant) {
        addToCart(matchedProduct, availableVariant);
      }
    }
  };

  const updateQuantity = (variantId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.variant.id !== variantId) return item;
      const newQty = Math.max(1, Math.min(item.quantity + delta, item.variant.currentStock));
      return { ...item, quantity: newQty };
    }));
  };

  const removeItem = (variantId: string) => {
    setCart(prev => prev.filter(i => i.variant.id !== variantId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.product.salePrice * item.quantity, 0);
  const discountValue = subtotal * (discount / 100);
  const total = subtotal - discountValue;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const changeAmount = paymentMethod === 'cash' && cashReceived ? Number(cashReceived) - total : 0;

  const handleFinalizeSale = (method: PaymentMethod) => {
    if (cart.length === 0) return;
    if (method === 'cash' && (!cashReceived || Number(cashReceived) < total)) return;

    const saleItems: SaleItem[] = cart.map(item => ({
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
      cashReceived: method === 'cash' ? Number(cashReceived) : undefined,
      change: method === 'cash' ? changeAmount : undefined,
      customerName: customerName || undefined,
    });

    setCart([]);
    setDiscount(0);
    setCustomerName('');
    setShowPayment(false);
    setPaymentMethod(null);
    setCashReceived('');
    setSuccess(true);
    setTimeout(() => { setSuccess(false); searchRef.current?.focus(); }, 3000);
  };

  // Filtered products for search panel
  const filteredProducts = searchQuery.trim().length >= 1
    ? products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.variants.some(v =>
          v.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.barcode.includes(searchQuery)
        )
      )
    : products;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-2 pb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-heading font-bold">Ponto de Venda</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            F2 pagamento · ESC cancelar · Enter adicionar
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Vendas hoje</p>
            <p className="text-sm font-bold">{todaySales.length} vendas · R$ {todayRevenue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Main: Cart (left) + Products (right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-0 overflow-hidden">
        {/* LEFT: Cart */}
        <div className="lg:col-span-3 flex flex-col glass-card rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
            <h3 className="font-heading font-semibold flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Carrinho
              {cart.length > 0 && (
                <Badge variant="secondary" className="ml-1 font-mono">
                  {cart.length} · {totalItems} pç
                </Badge>
              )}
            </h3>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setCart([])} className="text-destructive hover:text-destructive h-7 text-xs">
                <X className="w-3 h-3 mr-1" /> Limpar
              </Button>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center text-muted-foreground p-8">
                <div>
                  <ScanBarcode className="w-14 h-14 mx-auto mb-3 opacity-15" />
                  <p className="font-medium">Aguardando itens</p>
                  <p className="text-xs mt-1">Escaneie ou busque para começar</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {cart.map((item, index) => (
                  <div key={item.variant.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                    <span className="text-xs text-muted-foreground w-5 shrink-0">{index + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.variant.color} · {item.variant.size} · <span className="font-mono">{item.variant.sku}</span>
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      R$ {item.product.salePrice.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.variant.id, -1)}
                        className="w-7 h-7 rounded bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-mono font-bold text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.variant.id, 1)}
                        className="w-7 h-7 rounded bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-sm font-bold w-24 text-right shrink-0">
                      R$ {(item.product.salePrice * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeItem(item.variant.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart footer: totals */}
          {cart.length > 0 && (
            <div className="border-t border-border px-5 py-3 space-y-2 bg-muted/20 shrink-0">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({totalItems} itens)</span>
                <span className="font-mono">R$ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Desconto</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={discount || ''}
                  onChange={e => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                  className="w-16 text-right font-mono h-7 text-xs ml-auto"
                  placeholder="0"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-sm text-destructive">
                  <span>Desconto ({discount}%)</span>
                  <span className="font-mono">- R$ {discountValue.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-2xl font-bold pt-2 border-t border-border">
                <span>TOTAL</span>
                <span className="font-mono">R$ {total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Search + Products */}
        <div className="lg:col-span-2 flex flex-col gap-3 min-h-0">
          {/* Search bar */}
          <div className="glass-card rounded-xl p-4 shrink-0 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder="Nome, SKU, código de barras..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-10 font-mono h-11 text-base"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Input
              placeholder="Cliente (opcional)"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* Product list */}
          <div className="glass-card rounded-xl flex-1 overflow-y-auto min-h-0">
            <div className="divide-y divide-border/50">
              {filteredProducts.map(product => {
                const availableVariants = product.variants.filter(v => v.currentStock > 0);
                if (availableVariants.length === 0) return null;
                return (
                  <div key={product.id} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold">{product.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{product.reference}</p>
                      </div>
                      <span className="text-sm font-bold">R$ {product.salePrice.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {availableVariants.map(variant => (
                        <button
                          key={variant.id}
                          onClick={() => addToCart(product, variant)}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                        >
                          <span>{variant.color} {variant.size}</span>
                          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{variant.currentStock}</Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {filteredProducts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Nenhum produto encontrado</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM: Payment bar */}
      <div className="shrink-0 mt-4">
        {success && (
          <div className="mb-3 p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm font-medium flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Venda finalizada com sucesso!
          </div>
        )}

        {!showPayment ? (
          <Button
            onClick={() => setShowPayment(true)}
            disabled={cart.length === 0}
            className="w-full gap-3 h-14 text-lg font-bold rounded-xl"
            size="lg"
          >
            <Receipt className="w-6 h-6" />
            Finalizar Venda {cart.length > 0 && `— R$ ${total.toFixed(2)}`}
            <span className="text-xs opacity-70 font-normal ml-2">(F2)</span>
          </Button>
        ) : (
          <div className="glass-card rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Pagamento — R$ {total.toFixed(2)}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => { setShowPayment(false); setPaymentMethod(null); setCashReceived(''); }}>
                <X className="w-4 h-4 mr-1" /> Cancelar (ESC)
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Banknote className="w-8 h-8" />
                <span className="text-sm font-semibold">Dinheiro</span>
              </button>
              <button
                onClick={() => { setPaymentMethod('card'); handleFinalizeSale('card'); }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <CreditCard className="w-8 h-8" />
                <span className="text-sm font-semibold">Cartão</span>
              </button>
              <button
                onClick={() => { setPaymentMethod('pix'); handleFinalizeSale('pix'); }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'pix'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Smartphone className="w-8 h-8" />
                <span className="text-sm font-semibold">PIX</span>
              </button>
            </div>

            {paymentMethod === 'cash' && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium w-32">Valor recebido</label>
                  <Input
                    type="number"
                    value={cashReceived}
                    onChange={e => setCashReceived(e.target.value)}
                    className="font-mono text-lg h-12"
                    placeholder="0.00"
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter' && Number(cashReceived) >= total) {
                        handleFinalizeSale('cash');
                      }
                    }}
                  />
                </div>
                {Number(cashReceived) >= total && (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-success/10 border border-success/30">
                    <span className="text-lg font-semibold">Troco</span>
                    <span className="text-2xl font-bold font-mono text-success">
                      R$ {(Number(cashReceived) - total).toFixed(2)}
                    </span>
                  </div>
                )}
                <Button
                  onClick={() => handleFinalizeSale('cash')}
                  disabled={!cashReceived || Number(cashReceived) < total}
                  className="w-full h-12 text-lg font-bold gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Concluir Venda
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
