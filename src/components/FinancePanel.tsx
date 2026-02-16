import { useInventoryContext } from "@/contexts/InventoryContext";
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card } from "@/components/ui/card";

const COLORS = ["#22c55e", "#f59e42", "#6366f1", "#e11d48", "#0ea5e9"];

function getMonthShort(date: Date) {
  return date.toLocaleString("pt-BR", { month: "short" }).replace(".", "");
}

export default function FinancePanel() {
  const { sales, products } = useInventoryContext();

  // Receita total
  const receita = useMemo(
    () => sales.reduce((sum, s) => sum + s.total, 0),
    [sales],
  );

  // Despesa estimada: soma do custo dos itens vendidos
  const despesa = useMemo(() => {
    let total = 0;
    for (const sale of sales) {
      for (const item of sale.items) {
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          total += product.costPrice * item.quantity;
        }
      }
    }
    return total;
  }, [sales, products]);

  const lucro = receita - despesa;

  // Últimos 5 meses: receita e despesa por mês
  const ultimosMeses = useMemo(() => {
    const now = new Date();
    const meses: { mes: string; receita: number; despesa: number }[] = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mes =
        getMonthShort(d).charAt(0).toUpperCase() + getMonthShort(d).slice(1);
      meses.push({ mes, receita: 0, despesa: 0 });
    }
    sales.forEach((s) => {
      const idx = meses.findIndex((m) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (4 - meses.indexOf(m)));
        return (
          s.createdAt.getMonth() === d.getMonth() &&
          s.createdAt.getFullYear() === d.getFullYear()
        );
      });
      if (idx !== -1) {
        meses[idx].receita += s.total;
        for (const item of s.items) {
          const product = products.find((p) => p.id === item.productId);
          if (product) {
            meses[idx].despesa += product.costPrice * item.quantity;
          }
        }
      }
    });
    return meses;
  }, [sales, products]);

  // Receita por categoria
  const categorias = useMemo(() => {
    const map: Record<string, number> = {};
    for (const sale of sales) {
      for (const item of sale.items) {
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          map[product.category] =
            (map[product.category] || 0) + item.unitPrice * item.quantity;
        }
      }
    }
    return Object.entries(map).map(([categoria, valor]) => ({
      categoria,
      valor,
    }));
  }, [sales, products]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold">Painel Financeiro</h2>
        <p className="text-muted-foreground mt-1">
          Resumo financeiro do negócio
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Receita</p>
          <p className="text-2xl font-bold text-success">
            R$ {receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Despesa</p>
          <p className="text-2xl font-bold text-warning">
            R$ {despesa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Lucro</p>
          <p className="text-2xl font-bold text-primary">
            R$ {lucro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">
            Receita vs Despesa (últimos meses)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ultimosMeses}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip
                formatter={(v: number) =>
                  `R$ ${Number(v).toLocaleString("pt-BR")}`
                }
              />
              <Bar dataKey="receita" fill="#22c55e" name="Receita" />
              <Bar dataKey="despesa" fill="#f59e42" name="Despesa" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Receita por Categoria</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={categorias}
                dataKey="valor"
                nameKey="categoria"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label
              >
                {categorias.map((entry, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={COLORS[idx % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) =>
                  `R$ ${Number(v).toLocaleString("pt-BR")}`
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
