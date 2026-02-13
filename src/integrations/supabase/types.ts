export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          id: string
          message: string
          product_id: string
          product_name: string
          read: boolean
          reference: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          product_id: string
          product_name: string
          read?: boolean
          reference?: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          product_id?: string
          product_name?: string
          read?: boolean
          reference?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      colors: {
        Row: {
          created_at: string
          hex: string
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          hex?: string
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          hex?: string
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      inventory_logs: {
        Row: {
          created_at: string
          id: string
          product_id: string
          product_name: string
          quantity: number
          reason: string
          type: string
          user_id: string | null
          variant_id: string
          variant_label: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          product_name: string
          quantity?: number
          reason?: string
          type?: string
          user_id?: string | null
          variant_id: string
          variant_label: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          reason?: string
          type?: string
          user_id?: string | null
          variant_id?: string
          variant_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_logs_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          barcode: string
          color: string
          current_stock: number
          id: string
          product_id: string
          size: string
          sku: string
        }
        Insert: {
          barcode?: string
          color: string
          current_stock?: number
          id?: string
          product_id: string
          size: string
          sku?: string
        }
        Update: {
          barcode?: string
          color?: string
          current_stock?: number
          id?: string
          product_id?: string
          size?: string
          sku?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string
          category: string
          cost_price: number
          created_at: string
          description: string
          id: string
          image_url: string
          min_stock_threshold: number
          name: string
          reference: string
          sale_price: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          brand: string
          category: string
          cost_price?: number
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          min_stock_threshold?: number
          name: string
          reference: string
          sale_price?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          brand?: string
          category?: string
          cost_price?: number
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          min_stock_threshold?: number
          name?: string
          reference?: string
          sale_price?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          cnpj: string | null
          company_name: string
          created_at: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          plan: string | null
          provider: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          company_name?: string
          created_at?: string | null
          id: string
          is_active?: boolean | null
          phone?: string | null
          plan?: string | null
          provider?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          company_name?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          plan?: string | null
          provider?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          id: string
          product_id: string
          product_name: string
          quantity: number
          sale_id: string
          sku: string
          unit_price: number
          variant_id: string
          variant_label: string
        }
        Insert: {
          id?: string
          product_id: string
          product_name: string
          quantity?: number
          sale_id: string
          sku?: string
          unit_price?: number
          variant_id: string
          variant_label: string
        }
        Update: {
          id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          sale_id?: string
          sku?: string
          unit_price?: number
          variant_id?: string
          variant_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          cash_received: number | null
          change: number | null
          created_at: string
          customer_name: string | null
          discount: number
          id: string
          payment_method: string
          subtotal: number
          total: number
          user_id: string | null
        }
        Insert: {
          cash_received?: number | null
          change?: number | null
          created_at?: string
          customer_name?: string | null
          discount?: number
          id?: string
          payment_method?: string
          subtotal?: number
          total?: number
          user_id?: string | null
        }
        Update: {
          cash_received?: number | null
          change?: number | null
          created_at?: string
          customer_name?: string | null
          discount?: number
          id?: string
          payment_method?: string
          subtotal?: number
          total?: number
          user_id?: string | null
        }
        Relationships: []
      }
      sizes: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
