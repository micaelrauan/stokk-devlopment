import { useState, useRef } from 'react';
import { useInventoryContext } from '@/contexts/InventoryContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScanBarcode, Plus, Minus, Trash2, CheckCircle, ArrowDownToLine, ArrowUpFromLine, Settings2, Package, Search } from 'lucide-react';
import { ProductVariant, Product } from '@/types/inventory';
import ProductSearchDialog from '@/components/ProductSearchDialog';

interface ScannedItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

export default function OperationsPage() {
  const { findByBarcode, processOperation, inventoryLogs } = useInventoryContext();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [operationType, setOperationType] = useState<'OUT' | 'IN' | 'ADJUST'>('OUT');
  const [reason, setReason] = useState('');
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addVariant = (product: Product, variant: ProductVariant) => {
    setScannedItems(prev => {
      const existing = prev.findIndex(i => i.variant.id === variant.id);
      if (existing >= 0) {
        return prev.map((item, i) => i === existing ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, variant, quantity: 1 }];
    });
  };

  const handleScan = (code: string) => {
    if (!code.trim()) return;
    const found = findByBarcode(code.trim());
    if (!found) return;
    addVariant(found.product, found.variant);
    setBarcodeInput('');
    inputRef.current?.focus();
  };

  const updateQuantity = (variantId: string, delta: number) => {
    setScannedItems(prev => prev.map(item =>
      item.variant.id === variantId
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    ));
  };

  const removeItem = (variantId: string) => {
    setScannedItems(prev => prev.filter(i => i.variant.id !== variantId));
  };

  const handleFinalize = () => {
    if (scannedItems.length === 0) return;
    const items = scannedItems.map(i => ({
      productId: i.product.id,
      variantId: i.variant.id,
      quantity: i.quantity,
    }));
    const defaultReasons = { OUT: 'Venda', IN: 'Entrada de Fornecedor', ADJUST: 'Ajuste de Inventário' };
    processOperation(items, operationType, reason || defaultReasons[operationType]);
    setScannedItems([]);
    setReason('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const typeConfig = {
    OUT: { label: 'Venda (Saída)', icon: ArrowUpFromLine, color: 'text-destructive' },
    IN: { label: 'Entrada de Fornecedor', icon: ArrowDownToLine, color: 'text-success' },
    ADJUST: { label: 'Ajuste de Inventário', icon: Settings2, color: 'text-info' },
  };

  const totalQty = scannedItems.reduce((s, i) => s + i.quantity, 0);

  // Recent logs
  const recentLogs = inventoryLogs.slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold">Operações de Estoque</h1>
        <p className="text-muted-foreground mt-1">Registre entradas, saídas e ajustes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner + Config */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h3 className="font-heading font-semibold flex items-center gap-2">
              <ScanBarcode className="w-5 h-5" />
              Scanner
            </h3>
            <Input
              ref={inputRef}
              placeholder="Bipe ou digite o código..."
              value={barcodeInput}
              onChange={e => setBarcodeInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScan(barcodeInput)}
              className="font-mono"
              autoFocus
            />
            <Button onClick={() => handleScan(barcodeInput)} className="w-full gap-2" variant="outline">
              <Plus className="w-4 h-4" /> Adicionar Item
            </Button>
            <ProductSearchDialog
              onSelectVariant={(product, variant) => {
                addVariant(product, variant);
                inputRef.current?.focus();
              }}
              trigger={
                <Button variant="secondary" className="w-full gap-2">
                  <Search className="w-4 h-4" /> Busca Avançada
                </Button>
              }
            />
          </div>

          <div className="glass-card rounded-xl p-6 space-y-4">
            <h3 className="font-heading font-semibold">Tipo de Operação</h3>
            <Select value={operationType} onValueChange={v => setOperationType(v as 'OUT' | 'IN' | 'ADJUST')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(typeConfig).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
                      {cfg.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div>
              <label className="text-sm font-medium mb-1 block">Observação (opcional)</label>
              <Input
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Ex: Pedido #1234"
              />
            </div>
          </div>
        </div>

        {/* Scanned Items List */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold">Itens Bipados</h3>
              {scannedItems.length > 0 && (
                <span className="text-sm text-muted-foreground">{scannedItems.length} itens · {totalQty} peças</span>
              )}
            </div>

            {scannedItems.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <ScanBarcode className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Nenhum item bipado</p>
                <p className="text-sm mt-1">Escaneie um código de barras para começar.</p>
              </div>
            ) : (
              <div className="space-y-2 mb-6">
                {scannedItems.map(item => (
                  <div key={item.variant.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">{item.variant.color} · {item.variant.size} · <span className="font-mono">{item.variant.sku}</span></p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQuantity(item.variant.id, -1)} className="w-7 h-7 rounded bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors">
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={e => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val >= 1) {
                            setScannedItems(prev => prev.map(si =>
                              si.variant.id === item.variant.id ? { ...si, quantity: val } : si
                            ));
                          }
                        }}
                        className="w-14 text-center font-mono font-bold bg-card border border-border rounded h-7 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button onClick={() => updateQuantity(item.variant.id, 1)} className="w-7 h-7 rounded bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-sm font-bold w-20 text-right">R$ {(item.product.salePrice * item.quantity).toFixed(2)}</span>
                    <button onClick={() => removeItem(item.variant.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {scannedItems.length > 0 && (
              <Button onClick={handleFinalize} className="w-full gap-2" size="lg">
                <CheckCircle className="w-5 h-5" />
                Finalizar {typeConfig[operationType].label} — {totalQty} peças
              </Button>
            )}

            {success && (
              <div className="mt-4 p-4 rounded-lg bg-success/10 border border-success/30 text-success text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Operação registrada com sucesso!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent History */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-heading font-semibold mb-4">Histórico Recente</h3>
        {recentLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Nenhuma movimentação registrada.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentLogs.map(log => (
              <div key={log.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 text-sm">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  log.type === 'IN' ? 'bg-success/10 text-success' :
                  log.type === 'OUT' ? 'bg-destructive/10 text-destructive' :
                  'bg-info/10 text-info'
                }`}>
                  {log.type === 'IN' ? <ArrowDownToLine className="w-4 h-4" /> :
                   log.type === 'OUT' ? <ArrowUpFromLine className="w-4 h-4" /> :
                   <Settings2 className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{log.productName} — {log.variantLabel}</p>
                  <p className="text-xs text-muted-foreground">{log.reason}</p>
                </div>
                <span className={`font-mono font-bold ${log.quantity > 0 ? 'text-success' : 'text-destructive'}`}>
                  {log.quantity > 0 ? '+' : ''}{log.quantity}
                </span>
                <span className="text-xs text-muted-foreground w-20 text-right">
                  {new Date(log.timestamp).toLocaleDateString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
