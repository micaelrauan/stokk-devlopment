import { useMemo, useState } from "react";
import {
  Package,
  ShoppingBag,
  AlertTriangle,
  XCircle,
  TrendingDown,
  Activity,
} from "lucide-react";
import { useInventoryContext } from "@/contexts/InventoryContext";
import ProductDetailsDialog from "@/components/ProductDetailsDialog";
import { Product } from "@/types/inventory";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, subDays, startOfDay, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const CHART_COLORS = [
  "hsl(220, 20%, 14%)",
  "hsl(38, 92%, 50%)",
  "hsl(142, 71%, 45%)",
  "hsl(210, 100%, 52%)",
  "hsl(0, 72%, 51%)",
  "hsl(270, 60%, 50%)",
  "hsl(180, 60%, 40%)",
  "hsl(30, 80%, 55%)",
];

export default function DashboardPage() {
  const {
    products,
    totalProducts,
    totalItems,
    lowStockCount,
    outOfStockCount,
    alerts,
    inventoryLogs,
  } = useInventoryContext();

  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const stats = useMemo(
    () => [
      {
        label: "Produtos",
        value: totalProducts,
        icon: Package,
        color: "bg-info/10 text-info",
      },
      {
        label: "Peças em Estoque",
        value: totalItems,
        icon: ShoppingBag,
        color: "bg-success/10 text-success",
      },
      {
        label: "Estoque Baixo",
        value: lowStockCount,
        icon: AlertTriangle,
        color: "bg-warning/10 text-warning",
      },
      {
        label: "Esgotados",
        value: outOfStockCount,
        icon: XCircle,
        color: "bg-destructive/10 text-destructive",
      },
    ],
    [totalProducts, totalItems, lowStockCount, outOfStockCount],
  );

  const recentAlerts = useMemo(
    () => alerts.filter((a) => !a.read).slice(0, 5),
    [alerts],
  );

  // Pie chart: stock value by category
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      const totalStock = p.variants.reduce((s, v) => s + v.currentStock, 0);
      const value = totalStock * p.salePrice;
      map[p.category] = (map[p.category] || 0) + value;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [products]);

  // Bar chart: top 5 products with most movement (outs)
  const topMovement = useMemo(() => {
    const map: Record<string, { name: string; total: number }> = {};
    inventoryLogs
      .filter((l) => l.type === "OUT")
      .forEach((l) => {
        if (!map[l.productId])
          map[l.productId] = { name: l.productName, total: 0 };
        map[l.productId].total += Math.abs(l.quantity);
      });
    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [inventoryLogs]);

  // Line chart: entries vs exits last 7 days
  const movementHistory = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(date, "dd/MM", { locale: ptBR }),
        dateObj: startOfDay(date),
        entradas: 0,
        saidas: 0,
      };
    });
    inventoryLogs.forEach((l) => {
      const day = days.find((d) =>
        isSameDay(d.dateObj, startOfDay(new Date(l.timestamp))),
      );
      if (!day) return;
      if (l.type === "IN") day.entradas += Math.abs(l.quantity);
      else if (l.type === "OUT") day.saidas += Math.abs(l.quantity);
    });
    return days;
  }, [inventoryLogs]);

  // Stock health: % of variants at 0 or below min
  const totalVariants = products.reduce((s, p) => s + p.variants.length, 0);
  const healthyVariants = products.reduce(
    (s, p) =>
      s + p.variants.filter((v) => v.currentStock > p.minStockThreshold).length,
    0,
  );
  const healthPercent =
    totalVariants > 0
      ? Math.round((healthyVariants / totalVariants) * 100)
      : 100;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">Visão geral do seu estoque</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl sm:text-3xl font-heading font-bold mt-1">
                  {stat.value}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}
              >
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stock Health Card */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-heading font-semibold">
            Saúde do Estoque
          </h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={
                  healthPercent >= 70
                    ? "hsl(var(--success))"
                    : healthPercent >= 40
                      ? "hsl(var(--warning))"
                      : "hsl(var(--destructive))"
                }
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${healthPercent * 2.64} ${264 - healthPercent * 2.64}`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xl font-heading font-bold">
              {healthPercent}%
            </span>
          </div>
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-semibold text-success">
                {healthyVariants}
              </span>{" "}
              variações com estoque saudável
            </p>
            <p>
              <span className="font-semibold text-warning">
                {lowStockCount}
              </span>{" "}
              com estoque baixo
            </p>
            <p>
              <span className="font-semibold text-destructive">
                {outOfStockCount}
              </span>{" "}
              esgotadas
            </p>
            <p className="text-muted-foreground text-xs mt-2">
              De {totalVariants} variações totais
            </p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie: Stock value by category */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-heading font-semibold mb-4">
            Valor do Estoque por Categoria
          </h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                  fontSize={11}
                >
                  {categoryData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) =>
                    `R$ ${value.toLocaleString("pt-BR")}`
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">
              Sem dados disponíveis
            </p>
          )}
        </div>

        {/* Bar: Top 5 movement */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-heading font-semibold">
              Top 5 — Maior Giro (Saídas)
            </h2>
          </div>
          {topMovement.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topMovement} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis type="number" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={80}
                  fontSize={10}
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip />
                <Bar
                  dataKey="total"
                  name="Saídas"
                  fill="hsl(var(--accent))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">
              Sem movimentações registradas
            </p>
          )}
        </div>
      </div>

      {/* Line: Entries vs Exits */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-heading font-semibold mb-4">
          Movimentações — Últimos 7 dias
        </h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={movementHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              fontSize={11}
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              fontSize={11}
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="entradas"
              name="Entradas"
              stroke="hsl(var(--success))"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="saidas"
              name="Saídas"
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Alerts & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-heading font-semibold mb-4">
            Alertas Recentes
          </h2>
          {recentAlerts.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhum alerta pendente ✓
            </p>
          ) : (
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div
                    className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                      alert.type === "out_of_stock"
                        ? "bg-destructive"
                        : "bg-warning"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Ref: {alert.reference}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-heading font-semibold mb-4">
            Produtos com Menor Estoque
          </h2>
          <div className="space-y-3">
            {[...products]
              .sort((a, b) => {
                const totalA = a.variants.reduce(
                  (s, v) => s + v.currentStock,
                  0,
                );
                const totalB = b.variants.reduce(
                  (s, v) => s + v.currentStock,
                  0,
                );
                return totalA - totalB;
              })
              .slice(0, 5)
              .map((product) => {
                const total = product.variants.reduce(
                  (s, v) => s + v.currentStock,
                  0,
                );
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => setDetailProduct(product)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.reference} · {product.category}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-bold px-3 py-1 rounded-full ${
                        total === 0
                          ? "bg-destructive/10 text-destructive"
                          : total <= 10
                            ? "bg-warning/10 text-warning"
                            : "bg-success/10 text-success"
                      }`}
                    >
                      {total} un.
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
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
