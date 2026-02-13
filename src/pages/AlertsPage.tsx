import { useState } from 'react';
import { useInventoryContext } from '@/contexts/InventoryContext';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, CheckCheck, AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Alert } from '@/types/inventory';

type AlertFilter = 'all' | 'unread' | 'low_stock' | 'out_of_stock';

interface GroupedAlerts {
  productId: string;
  productName: string;
  reference: string;
  alerts: Alert[];
  unreadCount: number;
  hasOutOfStock: boolean;
}

const AlertsPage = () => {
  const { alerts, markAlertRead, markAllAlertsRead, unreadAlerts } = useInventoryContext();
  const [filter, setFilter] = useState<AlertFilter>('all');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  const filtered = alerts.filter(a => {
    if (filter === 'unread') return !a.read;
    if (filter === 'low_stock') return a.type === 'low_stock';
    if (filter === 'out_of_stock') return a.type === 'out_of_stock';
    return true;
  });

  // Group by product
  const grouped: GroupedAlerts[] = [];
  for (const alert of filtered) {
    let group = grouped.find(g => g.productId === alert.productId);
    if (!group) {
      group = { productId: alert.productId, productName: alert.productName, reference: alert.reference, alerts: [], unreadCount: 0, hasOutOfStock: false };
      grouped.push(group);
    }
    group.alerts.push(alert);
    if (!alert.read) group.unreadCount++;
    if (alert.type === 'out_of_stock') group.hasOutOfStock = true;
  }

  // Sort: unread first, then by most recent alert
  grouped.sort((a, b) => {
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
    const aLatest = Math.max(...a.alerts.map(x => x.createdAt.getTime()));
    const bLatest = Math.max(...b.alerts.map(x => x.createdAt.getTime()));
    return bLatest - aLatest;
  });

  const filters: { key: AlertFilter; label: string; count: number }[] = [
    { key: 'all', label: 'Todos', count: alerts.length },
    { key: 'unread', label: 'Não lidos', count: unreadAlerts },
    { key: 'out_of_stock', label: 'Esgotados', count: alerts.filter(a => a.type === 'out_of_stock').length },
    { key: 'low_stock', label: 'Estoque Baixo', count: alerts.filter(a => a.type === 'low_stock').length },
  ];

  const markGroupRead = (group: GroupedAlerts) => {
    group.alerts.filter(a => !a.read).forEach(a => markAlertRead(a.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">Avisos</h1>
          <p className="text-muted-foreground mt-1">
            {unreadAlerts > 0 ? `${unreadAlerts} não lido(s) · ${grouped.length} produto(s)` : 'Todos os avisos foram lidos'}
          </p>
        </div>
        {unreadAlerts > 0 && (
          <Button variant="outline" onClick={markAllAlertsRead} size="sm" className="gap-2">
            <CheckCheck className="w-4 h-4" />
            Marcar todos como lidos
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filter === f.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            {f.key === 'out_of_stock' && '🔴 '}{f.key === 'low_stock' && '🟡 '}{f.label}
            {f.count > 0 && <span className="ml-1 opacity-70">({f.count})</span>}
          </button>
        ))}
      </div>

      {/* Grouped alerts */}
      <div className="space-y-2">
        {grouped.map(group => {
          const isExpanded = expandedProduct === group.productId;
          const latestAlert = group.alerts.reduce((a, b) => a.createdAt > b.createdAt ? a : b);
          const statusIcon = group.hasOutOfStock ? XCircle : AlertTriangle;
          const StatusIcon = statusIcon;
          const statusColor = group.hasOutOfStock ? 'text-destructive' : 'text-yellow-500';
          const statusBg = group.hasOutOfStock ? 'bg-destructive/10' : 'bg-yellow-500/10';

          return (
            <div key={group.productId} className={`rounded-xl border transition-all ${group.unreadCount > 0 ? 'border-border bg-card shadow-sm' : 'border-border/50 bg-muted/20 opacity-75'}`}>
              {/* Product header */}
              <button
                onClick={() => setExpandedProduct(isExpanded ? null : group.productId)}
                className="w-full p-4 flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
              >
                <div className={`p-2 rounded-lg ${statusBg} shrink-0`}>
                  <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm truncate">{group.productName}</h3>
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">{group.reference}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {group.alerts.length} aviso(s) · último {format(latestAlert.createdAt, "dd MMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {group.unreadCount > 0 && (
                    <span className="bg-destructive text-destructive-foreground text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                      {group.unreadCount}
                    </span>
                  )}
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {/* Expanded: individual alerts */}
              {isExpanded && (
                <div className="border-t border-border">
                  {group.unreadCount > 0 && (
                    <div className="px-4 py-2 bg-muted/30 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => markGroupRead(group)} className="text-xs gap-1 h-7">
                        <BellOff className="w-3 h-3" />
                        Marcar grupo como lido
                      </Button>
                    </div>
                  )}
                  <div className="divide-y divide-border/50">
                    {group.alerts
                      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                      .map(alert => (
                        <div key={alert.id} className={`px-4 py-3 flex items-center gap-3 ${!alert.read ? '' : 'opacity-50'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${!alert.read ? 'bg-primary' : 'bg-transparent'}`} />
                          <p className="text-xs flex-1">{alert.message}</p>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {format(alert.createdAt, "dd/MM HH:mm")}
                          </span>
                          {!alert.read && (
                            <Button variant="ghost" size="icon" className="w-6 h-6 shrink-0" onClick={() => markAlertRead(alert.id)}>
                              <BellOff className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {grouped.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">
              {filter === 'all' ? 'Nenhum aviso registrado' : 'Nenhum aviso neste filtro'}
            </p>
            <p className="text-sm mt-1">Avisos de estoque aparecerão aqui automaticamente.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPage;
