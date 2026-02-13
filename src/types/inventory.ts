export interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  reference: string;
  category: string;
  brand: string;
  costPrice: number;
  salePrice: number;
  minStockThreshold: number;
  variants: ProductVariant[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id: string;
  productId: string;
  size: string;
  color: string;
  barcode: string;
  sku: string;
  currentStock: number;
}

export interface InventoryLog {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  variantLabel: string;
  type: "IN" | "OUT" | "ADJUST";
  quantity: number;
  reason: string;
  timestamp: Date;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: "cash" | "card" | "pix";
  cashReceived?: number;
  change?: number;
  customerName?: string;
  createdAt: Date;
}

export interface SaleItem {
  variantId: string;
  productId: string;
  productName: string;
  variantLabel: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

export interface Alert {
  id: string;
  type: "low_stock" | "out_of_stock" | "new_arrival" | "price_change";
  message: string;
  productId: string;
  productName: string;
  reference: string;
  read: boolean;
  createdAt: Date;
}

// DB row types (snake_case from Supabase)
export interface DbProduct {
  id: string;
  name: string;
  description: string;
  image_url: string;
  reference: string;
  category: string;
  brand: string;
  cost_price: number;
  sale_price: number;
  min_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface DbProductVariant {
  id: string;
  product_id: string;
  size: string;
  color: string;
  barcode: string;
  sku: string;
  current_stock: number;
}

export interface DbSale {
  id: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  cash_received: number | null;
  change: number | null;
  customer_name: string | null;
  created_at: string;
}

export interface DbSaleItem {
  id: string;
  sale_id: string;
  variant_id: string;
  product_id: string;
  product_name: string;
  variant_label: string;
  sku: string;
  quantity: number;
  unit_price: number;
}

export interface DbInventoryLog {
  id: string;
  variant_id: string;
  product_id: string;
  product_name: string;
  variant_label: string;
  type: string;
  quantity: number;
  reason: string;
  created_at: string;
}

export interface DbAlert {
  id: string;
  type: string;
  message: string;
  product_id: string;
  product_name: string;
  reference: string;
  read: boolean;
  created_at: string;
}
export interface Category {
  id: string;
  name: string;
  createdAt: Date;
}

export interface ColorItem {
  id: string;
  name: string;
  hex: string;
  createdAt: Date;
}

export interface SizeItem {
  id: string;
  name: string;
  displayOrder: number;
  createdAt: Date;
}

export const SIZES = ["PP", "P", "M", "G", "GG", "XG", "EG"] as const;
