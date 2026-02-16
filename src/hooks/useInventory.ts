import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Product,
  Alert,
  ProductVariant,
  InventoryLog,
  Sale,
  DbProduct,
  DbProductVariant,
  DbSale,
  DbSaleItem,
  DbInventoryLog,
  DbAlert,
  Category,
  ColorItem,
  SizeItem,
} from "@/types/inventory";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const from = (table: string) => (supabase as any).from(table);

function mapProduct(row: DbProduct, variants: DbProductVariant[]): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    imageUrl: row.image_url ?? "",
    reference: row.reference,
    category: row.category,
    brand: row.brand,
    costPrice: Number(row.cost_price),
    salePrice: Number(row.sale_price),
    minStockThreshold: row.min_stock_threshold,
    variants: variants
      .filter((v) => v.product_id === row.id)
      .map((v) => ({
        id: v.id,
        productId: v.product_id,
        size: v.size,
        color: v.color,
        barcode: v.barcode,
        sku: v.sku,
        currentStock: v.current_stock,
      })),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapAlert(row: DbAlert): Alert {
  return {
    id: row.id,
    type: row.type as Alert["type"],
    message: row.message,
    productId: row.product_id,
    productName: row.product_name,
    reference: row.reference,
    read: row.read,
    createdAt: new Date(row.created_at),
  };
}

function mapLog(row: DbInventoryLog): InventoryLog {
  return {
    id: row.id,
    variantId: row.variant_id,
    productId: row.product_id,
    productName: row.product_name,
    variantLabel: row.variant_label,
    type: row.type as InventoryLog["type"],
    quantity: row.quantity,
    reason: row.reason,
    timestamp: new Date(row.created_at),
  };
}

function mapSale(row: DbSale, items: DbSaleItem[]): Sale {
  return {
    id: row.id,
    items: items
      .filter((i) => i.sale_id === row.id)
      .map((i) => ({
        variantId: i.variant_id,
        productId: i.product_id,
        productName: i.product_name,
        variantLabel: i.variant_label,
        sku: i.sku,
        quantity: i.quantity,
        unitPrice: Number(i.unit_price),
      })),
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    total: Number(row.total),
    paymentMethod: row.payment_method as Sale["paymentMethod"],
    cashReceived:
      row.cash_received != null ? Number(row.cash_received) : undefined,
    change: row.change != null ? Number(row.change) : undefined,
    customerName: row.customer_name ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

// Inventory management hook — v4 (optimized)
export function useInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [colors, setColors] = useState<ColorItem[]>([]);
  const [sizes, setSizes] = useState<SizeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Ref to always have current products — avoids stale closures in callbacks
  const productsRef = useRef(products);
  productsRef.current = products;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [
      prodRes,
      varRes,
      alertRes,
      logRes,
      saleRes,
      siRes,
      catRes,
      colRes,
      sizeRes,
    ] = await Promise.all([
      from("products").select("*").order("created_at", { ascending: false }),
      from("product_variants").select("*"),
      from("alerts").select("*").order("created_at", { ascending: false }),
      from("inventory_logs")
        .select("*")
        .order("created_at", { ascending: false }),
      from("sales").select("*").order("created_at", { ascending: false }),
      from("sale_items").select("*"),
      from("categories").select("*").order("name"),
      from("colors").select("*").order("name"),
      from("sizes").select("*").order("display_order"),
    ]);
    setProducts(
      (prodRes.data ?? []).map((p: DbProduct) =>
        mapProduct(p, varRes.data ?? []),
      ),
    );
    setAlerts((alertRes.data ?? []).map((a: DbAlert) => mapAlert(a)));
    setInventoryLogs((logRes.data ?? []).map((l: DbInventoryLog) => mapLog(l)));
    setSales(
      (saleRes.data ?? []).map((s: DbSale) => mapSale(s, siRes.data ?? [])),
    );
    setCategories(
      (catRes.data ?? []).map(
        (c: { id: string; name: string; created_at: string }) => ({
          id: c.id,
          name: c.name,
          createdAt: new Date(c.created_at),
        }),
      ),
    );
    setColors(
      (colRes.data ?? []).map(
        (c: { id: string; name: string; hex: string; created_at: string }) => ({
          id: c.id,
          name: c.name,
          hex: c.hex,
          createdAt: new Date(c.created_at),
        }),
      ),
    );
    setSizes(
      (sizeRes.data ?? []).map(
        (s: {
          id: string;
          name: string;
          display_order: number;
          created_at: string;
        }) => ({
          id: s.id,
          name: s.name,
          displayOrder: s.display_order,
          createdAt: new Date(s.created_at),
        }),
      ),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    // Auto-refresh every 15 seconds — only when tab is visible
    const interval = setInterval(async () => {
      if (document.hidden) return;
      const [alertRes, varRes, prodRes] = await Promise.all([
        from("alerts").select("*").order("created_at", { ascending: false }),
        from("product_variants").select("*"),
        from("products").select("*").order("created_at", { ascending: false }),
      ]);
      if (alertRes.data)
        setAlerts(alertRes.data.map((a: DbAlert) => mapAlert(a)));
      if (prodRes.data && varRes.data)
        setProducts(
          prodRes.data.map((p: DbProduct) => mapProduct(p, varRes.data ?? [])),
        );
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const addProduct = useCallback(
    async (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await from("products")
        .insert({
          name: product.name,
          reference: product.reference,
          category: product.category,
          brand: product.brand,
          cost_price: product.costPrice,
          sale_price: product.salePrice,
          min_stock_threshold: product.minStockThreshold,
          description: product.description ?? "",
          image_url: product.imageUrl ?? "",
          user_id: user.id,
        })
        .select()
        .single();
      if (error || !data) {
        logger.error("addProduct error", error);
        return null;
      }

      if (product.variants.length > 0) {
        await from("product_variants").insert(
          product.variants.map((v) => ({
            product_id: data.id,
            size: v.size,
            color: v.color,
            barcode: v.barcode,
            sku: v.sku,
            current_stock: v.currentStock,
          })),
        );
      }
      await fetchAll();
      return data;
    },
    [fetchAll],
  );

  const updateProduct = useCallback(
    async (
      productId: string,
      updates: Partial<
        Omit<Product, "id" | "createdAt" | "updatedAt" | "variants">
      >,
    ) => {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined)
        dbUpdates.description = updates.description;
      if (updates.imageUrl !== undefined)
        dbUpdates.image_url = updates.imageUrl;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.brand !== undefined) dbUpdates.brand = updates.brand;
      if (updates.costPrice !== undefined)
        dbUpdates.cost_price = updates.costPrice;
      if (updates.salePrice !== undefined)
        dbUpdates.sale_price = updates.salePrice;
      if (updates.minStockThreshold !== undefined)
        dbUpdates.min_stock_threshold = updates.minStockThreshold;
      dbUpdates.updated_at = new Date().toISOString();
      const { error } = await from("products")
        .update(dbUpdates)
        .eq("id", productId);
      if (error) {
        logger.error("updateProduct error", error);
        return null;
      }
      setProducts((prev) =>
        prev.map((p) =>
          p.id !== productId ? p : { ...p, ...updates, updatedAt: new Date() },
        ),
      );
      return true;
    },
    [],
  );

  const deleteProduct = useCallback(async (productId: string) => {
    // Remove logs de inventário relacionados
    await from("inventory_logs").delete().eq("product_id", productId);
    // Remove alertas relacionados
    await from("alerts").delete().eq("product_id", productId);
    // Busca vendas relacionadas
    const saleItemsRes = await from("sale_items")
      .select("sale_id")
      .eq("product_id", productId);
    const saleIds = Array.from(
      new Set((saleItemsRes.data ?? []).map((si: any) => si.sale_id)),
    );
    if (saleIds.length > 0) {
      // Remove sale_items
      await from("sale_items").delete().in("sale_id", saleIds);
      // Remove sales
      await from("sales").delete().in("id", saleIds);
    }
    // Remove variações
    await from("product_variants").delete().eq("product_id", productId);
    // Remove o produto
    await from("products").delete().eq("id", productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  const updateVariantStock = useCallback(
    async (productId: string, variantId: string, quantity: number) => {
      await from("product_variants")
        .update({ current_stock: quantity })
        .eq("id", variantId);
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== productId) return p;
          return {
            ...p,
            variants: p.variants.map((v) =>
              v.id !== variantId ? v : { ...v, currentStock: quantity },
            ),
            updatedAt: new Date(),
          };
        }),
      );

      const product = productsRef.current.find((p) => p.id === productId);
      const variant = product?.variants.find((v) => v.id === variantId);
      if (product && variant) {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (quantity === 0) {
          await from("alerts").insert({
            type: "out_of_stock",
            message: `${product.name} - ${variant.color} ${variant.size} está esgotado`,
            product_id: productId,
            product_name: product.name,
            reference: product.reference,
            user_id: userId,
          });
        } else if (quantity < product.minStockThreshold) {
          await from("alerts").insert({
            type: "low_stock",
            message: `${product.name} - ${variant.color} ${variant.size} com estoque baixo (${quantity}/${product.minStockThreshold} un.)`,
            product_id: productId,
            product_name: product.name,
            reference: product.reference,
            user_id: userId,
          });
        }
      }
    },
    [],
  );

  const processOperation = useCallback(
    async (
      items: { productId: string; variantId: string; quantity: number }[],
      type: "IN" | "OUT" | "ADJUST",
      reason: string,
    ) => {
      // Get user once before the loop — avoids N network round-trips
      const currentUserId = (await supabase.auth.getUser()).data.user?.id;

      for (const item of items) {
        const product = productsRef.current.find(
          (p) => p.id === item.productId,
        );
        const variant = product?.variants.find((v) => v.id === item.variantId);
        if (!product || !variant) continue;

        let newStock = variant.currentStock;
        if (type === "IN") newStock += item.quantity;
        else if (type === "OUT")
          newStock = Math.max(0, newStock - item.quantity);
        else newStock = Math.max(0, newStock + item.quantity);

        await from("product_variants")
          .update({ current_stock: newStock })
          .eq("id", item.variantId);
        await from("inventory_logs").insert({
          variant_id: item.variantId,
          product_id: item.productId,
          product_name: product.name,
          variant_label: `${variant.color} ${variant.size}`,
          type,
          quantity: type === "OUT" ? -item.quantity : item.quantity,
          reason,
          user_id: currentUserId,
        });

        if (newStock === 0) {
          await from("alerts").insert({
            type: "out_of_stock",
            message: `${product.name} - ${variant.color} ${variant.size} está esgotado`,
            product_id: product.id,
            product_name: product.name,
            reference: product.reference,
            user_id: currentUserId,
          });
        } else if (newStock < product.minStockThreshold) {
          await from("alerts").insert({
            type: "low_stock",
            message: `${product.name} - ${variant.color} ${variant.size} com estoque baixo (${newStock}/${product.minStockThreshold} un.)`,
            product_id: product.id,
            product_name: product.name,
            reference: product.reference,
            user_id: currentUserId,
          });
        }
      }
      await fetchAll();
    },
    [fetchAll],
  );

  const registerSale = useCallback(
    async (sale: Omit<Sale, "id" | "createdAt">) => {
      const currentUserId = (await supabase.auth.getUser()).data.user?.id;
      const { data, error } = await from("sales")
        .insert({
          subtotal: sale.subtotal,
          discount: sale.discount,
          total: sale.total,
          payment_method: sale.paymentMethod,
          cash_received: sale.cashReceived ?? null,
          change: sale.change ?? null,
          customer_name: sale.customerName ?? null,
          user_id: currentUserId,
        })
        .select()
        .single();
      if (error || !data) {
        logger.error("registerSale error", error);
        return null;
      }

      await from("sale_items").insert(
        sale.items.map((i) => ({
          sale_id: data.id,
          variant_id: i.variantId,
          product_id: i.productId,
          product_name: i.productName,
          variant_label: i.variantLabel,
          sku: i.sku,
          quantity: i.quantity,
          unit_price: i.unitPrice,
        })),
      );

      const opItems = sale.items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      }));
      await processOperation(
        opItems,
        "OUT",
        `Venda #${data.id.slice(-6)}${sale.customerName ? ` — ${sale.customerName}` : ""}`,
      );
      return data;
    },
    [processOperation],
  );

  const markAlertRead = useCallback(async (alertId: string) => {
    await from("alerts").update({ read: true }).eq("id", alertId);
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, read: true } : a)),
    );
  }, []);

  const markAllAlertsRead = useCallback(async () => {
    await from("alerts").update({ read: true }).eq("read", false);
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  }, []);

  const addCategory = useCallback(async (name: string) => {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await from("categories")
      .insert({ name, user_id: currentUserId })
      .select()
      .single();
    if (error) {
      logger.error("addCategory error", error);
      return null;
    }
    setCategories((prev) =>
      [
        ...prev,
        { id: data.id, name: data.name, createdAt: new Date(data.created_at) },
      ].sort((a, b) => a.name.localeCompare(b.name)),
    );
    return data;
  }, []);

  const deleteCategory = useCallback(async (categoryId: string) => {
    await from("categories").delete().eq("id", categoryId);
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
  }, []);

  const updateCategory = useCallback(
    async (categoryId: string, newName: string) => {
      const oldCat = categories.find((c) => c.id === categoryId);
      const { error } = await from("categories")
        .update({ name: newName })
        .eq("id", categoryId);
      if (error) {
        logger.error("updateCategory error", error);
        return null;
      }
      // Also update products that use the old category name
      if (oldCat) {
        await from("products")
          .update({ category: newName })
          .eq("category", oldCat.name);
        setProducts((prev) =>
          prev.map((p) =>
            p.category === oldCat.name ? { ...p, category: newName } : p,
          ),
        );
      }
      setCategories((prev) =>
        prev
          .map((c) => (c.id === categoryId ? { ...c, name: newName } : c))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      return true;
    },
    [categories],
  );

  const addColor = useCallback(async (name: string, hex: string) => {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await from("colors")
      .insert({ name, hex, user_id: currentUserId })
      .select()
      .single();
    if (error) {
      logger.error("addColor error", error);
      return null;
    }
    setColors((prev) =>
      [
        ...prev,
        {
          id: data.id,
          name: data.name,
          hex: data.hex,
          createdAt: new Date(data.created_at),
        },
      ].sort((a, b) => a.name.localeCompare(b.name)),
    );
    return data;
  }, []);

  const deleteColor = useCallback(async (colorId: string) => {
    await from("colors").delete().eq("id", colorId);
    setColors((prev) => prev.filter((c) => c.id !== colorId));
  }, []);

  const updateColor = useCallback(
    async (colorId: string, name: string, hex: string) => {
      const { error } = await from("colors")
        .update({ name, hex })
        .eq("id", colorId);
      if (error) {
        logger.error("updateColor error", error);
        return null;
      }
      setColors((prev) =>
        prev
          .map((c) => (c.id === colorId ? { ...c, name, hex } : c))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      return true;
    },
    [],
  );

  // Sizes CRUD
  const addSize = useCallback(async (name: string, displayOrder: number) => {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await from("sizes")
      .insert({ name, display_order: displayOrder, user_id: currentUserId })
      .select()
      .single();
    if (error) {
      logger.error("addSize error", error);
      return null;
    }
    setSizes((prev) =>
      [
        ...prev,
        {
          id: data.id,
          name: data.name,
          displayOrder: data.display_order,
          createdAt: new Date(data.created_at),
        },
      ].sort((a, b) => a.displayOrder - b.displayOrder),
    );
    return data;
  }, []);

  const deleteSize = useCallback(async (sizeId: string) => {
    await from("sizes").delete().eq("id", sizeId);
    setSizes((prev) => prev.filter((s) => s.id !== sizeId));
  }, []);

  const updateSize = useCallback(
    async (sizeId: string, name: string, displayOrder: number) => {
      const { error } = await from("sizes")
        .update({ name, display_order: displayOrder })
        .eq("id", sizeId);
      if (error) {
        logger.error("updateSize error", error);
        return null;
      }
      setSizes((prev) =>
        prev
          .map((s) => (s.id === sizeId ? { ...s, name, displayOrder } : s))
          .sort((a, b) => a.displayOrder - b.displayOrder),
      );
      return true;
    },
    [],
  );

  const findByBarcode = useCallback(
    (barcode: string): { product: Product; variant: ProductVariant } | null => {
      for (const product of products) {
        const variant = product.variants.find((v) => v.barcode === barcode);
        if (variant) return { product, variant };
      }
      return null;
    },
    [products],
  );

  const totalProducts = products.length;
  const totalItems = useMemo(
    () =>
      products.reduce(
        (sum, p) => sum + p.variants.reduce((s, v) => s + v.currentStock, 0),
        0,
      ),
    [products],
  );
  const lowStockCount = useMemo(
    () =>
      products.reduce(
        (sum, p) =>
          sum +
          p.variants.filter(
            (v) => v.currentStock > 0 && v.currentStock < p.minStockThreshold,
          ).length,
        0,
      ),
    [products],
  );
  const outOfStockCount = useMemo(
    () =>
      products.reduce(
        (sum, p) => sum + p.variants.filter((v) => v.currentStock === 0).length,
        0,
      ),
    [products],
  );
  const unreadAlerts = useMemo(
    () => alerts.filter((a) => !a.read).length,
    [alerts],
  );
  const todaySales = useMemo(() => {
    const today = new Date().toDateString();
    return sales.filter((s) => s.createdAt.toDateString() === today);
  }, [sales]);
  const todayRevenue = useMemo(
    () => todaySales.reduce((sum, s) => sum + s.total, 0),
    [todaySales],
  );

  return {
    products,
    alerts,
    inventoryLogs,
    sales,
    categories,
    colors,
    sizes,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    updateVariantStock,
    processOperation,
    registerSale,
    markAlertRead,
    markAllAlertsRead,
    findByBarcode,
    fetchAll,
    addCategory,
    deleteCategory,
    updateCategory,
    addColor,
    deleteColor,
    updateColor,
    addSize,
    deleteSize,
    updateSize,
    totalProducts,
    totalItems,
    lowStockCount,
    outOfStockCount,
    unreadAlerts,
    todaySales,
    todayRevenue,
  };
}
