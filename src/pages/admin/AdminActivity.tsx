import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const from = (table: string) => (supabase as any).from(table);

export default function AdminActivity() {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const load = async () => {
      const { data } = await from('inventory_logs').select('*').order('created_at', { ascending: false }).limit(100);
      setLogs(data ?? []);
    };
    load();
  }, []);

  const filtered = logs.filter(log => {
    const matchesSearch = !search ||
      (log.product_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.variant_label || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.reason || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || log.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold">Atividade</h1>
        <p className="text-muted-foreground mt-1">Logs de atividade recentes ({filtered.length} registros)</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por produto, variante ou motivo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-muted-foreground" /></button>}
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="IN">Entrada</SelectItem>
            <SelectItem value="OUT">Saída</SelectItem>
            <SelectItem value="ADJUST">Ajuste</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="glass-card rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="text-left py-3 px-4 font-medium">Data</th>
              <th className="text-left py-3 px-4 font-medium">Produto</th>
              <th className="text-left py-3 px-4 font-medium hidden sm:table-cell">Variante</th>
              <th className="text-left py-3 px-4 font-medium">Tipo</th>
              <th className="text-left py-3 px-4 font-medium">Qtd</th>
              <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Motivo</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(log => (
              <tr key={log.id} className="border-t border-border/50">
                <td className="py-2 px-4 text-muted-foreground">{new Date(log.created_at).toLocaleString('pt-BR')}</td>
                <td className="py-2 px-4">{log.product_name}</td>
                <td className="py-2 px-4 text-muted-foreground hidden sm:table-cell">{log.variant_label}</td>
                <td className="py-2 px-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${log.type === 'IN' ? 'bg-success/10 text-success' : log.type === 'OUT' ? 'bg-destructive/10 text-destructive' : 'bg-info/10 text-info'}`}>
                    {log.type}
                  </span>
                </td>
                <td className="py-2 px-4 font-mono">{log.quantity}</td>
                <td className="py-2 px-4 text-muted-foreground text-xs hidden md:table-cell">{log.reason}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Nenhuma atividade registrada</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
