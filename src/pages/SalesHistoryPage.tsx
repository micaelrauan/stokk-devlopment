import { useState, useMemo } from 'react';
import { useInventoryContext } from '@/contexts/InventoryContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search, ChevronDown, ChevronUp, Calendar, Receipt,
  Banknote, CreditCard, Smartphone, Package, Filter, X,
} from 'lucide-react';
import { Sale } from '@/types/inventory';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PAYMENT_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  cash: { label: 'Dinheiro', icon: <Banknote className="w-4 h-4" /> },
  card: { label: 'Cartão', icon: <CreditCard className="w-4 h-4" /> },
  pix: { label: 'PIX', icon: <Smartphone className="w-4 h-4" /> },
};

function SaleRow({ sale }: { sale: Sale }) {
  const [open, setOpen] = useState(false);
  const payment = PAYMENT_LABELS[sale.paymentMethod];

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors text-left"
      >
        <Receipt className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">
            Venda #{sale.id.slice(-6)}
            {sale.customerName && (
              <span className="text-muted-foreground font-normal ml-2">— {sale.customerName}</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(sale.createdAt, "dd 'de' MMMM, HH:mm", { locale: ptBR })}
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 shrink-0">
          {payment.icon}
          {payment.label}
        </Badge>
        <span className="text-sm font-bold font-mono shrink-0 w-28 text-right">
          R$ {sale.total.toFixed(2)}
        </span>
        {open ? <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-border bg-muted/10 px-5 py-4 space-y-3">
          {/* Items */}
          <div className="space-y-1.5">
            {sale.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <Package className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate">
                  {item.productName}
                  <span className="text-muted-foreground ml-1">({item.variantLabel})</span>
                </span>
                <span className="text-muted-foreground font-mono text-xs">{item.sku}</span>
                <span className="font-mono text-xs w-8 text-center">{item.quantity}×</span>
                <span className="font-mono w-24 text-right">R$ {(item.unitPrice * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="border-t border-border pt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">R$ {sale.subtotal.toFixed(2)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Desconto ({sale.discount}%)</span>
                <span className="font-mono">- R$ {(sale.subtotal * sale.discount / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1">
              <span>Total</span>
              <span className="font-mono">R$ {sale.total.toFixed(2)}</span>
            </div>
            {sale.paymentMethod === 'cash' && sale.cashReceived != null && (
              <div className="flex justify-between text-muted-foreground">
                <span>Recebido / Troco</span>
                <span className="font-mono">
                  R$ {sale.cashReceived.toFixed(2)} / R$ {(sale.change ?? 0).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SalesHistoryPage() {
  const { sales } = useInventoryContext();
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return sales.filter(s => {
      if (paymentFilter !== 'all' && s.paymentMethod !== paymentFilter) return false;
      if (dateFilter) {
        const saleDate = format(s.createdAt, 'yyyy-MM-dd');
        if (saleDate !== dateFilter) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchId = s.id.includes(q);
        const matchCustomer = s.customerName?.toLowerCase().includes(q);
        const matchItem = s.items.some(
          i => i.productName.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)
        );
        if (!matchId && !matchCustomer && !matchItem) return false;
      }
      return true;
    });
  }, [sales, search, dateFilter, paymentFilter]);

  const totalFiltered = filtered.reduce((s, sale) => s + sale.total, 0);
  const hasFilters = search || dateFilter || paymentFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold">Histórico de Vendas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {sales.length} vendas registradas
        </p>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, produto, SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="pl-10 h-9 w-44"
          />
        </div>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-40 h-9">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="cash">Dinheiro</SelectItem>
            <SelectItem value="card">Cartão</SelectItem>
            <SelectItem value="pix">PIX</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSearch(''); setDateFilter(''); setPaymentFilter('all'); }}
            className="h-9 text-xs"
          >
            <X className="w-3 h-3 mr-1" /> Limpar
          </Button>
        )}
      </div>

      {/* Summary */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-6 text-sm">
          <span className="text-muted-foreground">
            {filtered.length} venda{filtered.length !== 1 ? 's' : ''}
          </span>
          <span className="font-bold font-mono">
            Total: R$ {totalFiltered.toFixed(2)}
          </span>
        </div>
      )}

      {/* Sales list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="glass-card rounded-xl text-center py-16 text-muted-foreground">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-15" />
            <p className="font-medium">Nenhuma venda encontrada</p>
            <p className="text-xs mt-1">
              {hasFilters ? 'Tente ajustar os filtros' : 'As vendas realizadas no PDV aparecerão aqui'}
            </p>
          </div>
        ) : (
          filtered.map(sale => <SaleRow key={sale.id} sale={sale} />)
        )}
      </div>
    </div>
  );
}
