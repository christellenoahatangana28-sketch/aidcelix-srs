export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      addresses: {
        Row: {
          created_at: string;
          id: string;
          is_default: boolean;
          label: string;
          lat: number | null;
          line: string;
          lng: number | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_default?: boolean;
          label?: string;
          lat?: number | null;
          line: string;
          lng?: number | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_default?: boolean;
          label?: string;
          lat?: number | null;
          line?: string;
          lng?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      countries: {
        Row: { code: string; currency: string; locale: string; name: string };
        Insert: { code: string; currency: string; locale?: string; name: string };
        Update: { code?: string; currency?: string; locale?: string; name?: string };
        Relationships: [];
      };
      deliveries: {
        Row: {
          id: string;
          order_id: string;
          provider_ref: string | null;
          status: Database["public"]["Enums"]["delivery_status"];
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          provider_ref?: string | null;
          status?: Database["public"]["Enums"]["delivery_status"];
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          provider_ref?: string | null;
          status?: Database["public"]["Enums"]["delivery_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      medications: {
        Row: {
          brand: string;
          category: string;
          dosage: string;
          generic_name: string;
          id: string;
          image_path: string;
          manufacturer: string;
          name: string;
          slug: string;
        };
        Insert: {
          brand: string;
          category: string;
          dosage: string;
          generic_name: string;
          id?: string;
          image_path: string;
          manufacturer: string;
          name: string;
          slug: string;
        };
        Update: {
          brand?: string;
          category?: string;
          dosage?: string;
          generic_name?: string;
          id?: string;
          image_path?: string;
          manufacturer?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          aidcelix_unit_price: number;
          id: string;
          medication_id: string;
          medication_name: string;
          order_id: string;
          pharmacy_due: number;
          platform_fee: number;
          quantity: number;
        };
        Insert: {
          aidcelix_unit_price: number;
          id?: string;
          medication_id: string;
          medication_name: string;
          order_id: string;
          pharmacy_due: number;
          platform_fee: number;
          quantity: number;
        };
        Update: {
          aidcelix_unit_price?: number;
          id?: string;
          medication_id?: string;
          medication_name?: string;
          order_id?: string;
          pharmacy_due?: number;
          platform_fee?: number;
          quantity?: number;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          created_at: string;
          currency: string;
          delivery_distance_km: number | null;
          delivery_fee: number;
          dropoff_contact: string;
          dropoff_label: string;
          dropoff_lat: number;
          dropoff_lng: number;
          grand_total: number;
          id: string;
          med_total: number;
          pharmacy_due: number;
          pharmacy_id: string;
          pickup_code: string;
          customer_name: string;
          platform_fee: number;
          status: Database["public"]["Enums"]["order_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          currency: string;
          delivery_distance_km?: number | null;
          delivery_fee: number;
          dropoff_contact: string;
          dropoff_label: string;
          dropoff_lat: number;
          dropoff_lng: number;
          grand_total: number;
          id?: string;
          med_total: number;
          pharmacy_due: number;
          pharmacy_id: string;
          pickup_code?: string;
          customer_name?: string;
          platform_fee: number;
          status?: Database["public"]["Enums"]["order_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          delivery_distance_km?: number | null;
          delivery_fee?: number;
          dropoff_contact?: string;
          dropoff_label?: string;
          dropoff_lat?: number;
          dropoff_lng?: number;
          grand_total?: number;
          id?: string;
          med_total?: number;
          pharmacy_due?: number;
          pharmacy_id?: string;
          pickup_code?: string;
          customer_name?: string;
          platform_fee?: number;
          status?: Database["public"]["Enums"]["order_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount: number;
          collect_to: string;
          created_at: string;
          id: string;
          method: Database["public"]["Enums"]["payment_method"];
          order_id: string;
          provider_ref: string | null;
          status: Database["public"]["Enums"]["payment_status"];
        };
        Insert: {
          amount: number;
          collect_to?: string;
          created_at?: string;
          id?: string;
          method: Database["public"]["Enums"]["payment_method"];
          order_id: string;
          provider_ref?: string | null;
          status: Database["public"]["Enums"]["payment_status"];
        };
        Update: {
          amount?: number;
          collect_to?: string;
          created_at?: string;
          id?: string;
          method?: Database["public"]["Enums"]["payment_method"];
          order_id?: string;
          provider_ref?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
        };
        Relationships: [];
      };
      pharmacies: {
        Row: {
          address: string;
          country_code: string;
          hours: string | null;
          id: string;
          lat: number;
          lng: number;
          location: unknown;
          name: string;
          phone: string | null;
          prep_minutes: number;
          rating: number;
          slug: string;
        };
        Insert: {
          address: string;
          country_code: string;
          hours?: string | null;
          id?: string;
          lat: number;
          lng: number;
          location?: unknown;
          name: string;
          phone?: string | null;
          prep_minutes?: number;
          rating?: number;
          slug: string;
        };
        Update: {
          address?: string;
          country_code?: string;
          hours?: string | null;
          id?: string;
          lat?: number;
          lng?: number;
          location?: unknown;
          name?: string;
          phone?: string | null;
          prep_minutes?: number;
          rating?: number;
          slug?: string;
        };
        Relationships: [];
      };
      pharmacy_inventory: {
        Row: {
          medication_id: string;
          pharmacy_id: string;
          stock_status: Database["public"]["Enums"]["stock_status"];
          updated_at: string;
        };
        Insert: {
          medication_id: string;
          pharmacy_id: string;
          stock_status?: Database["public"]["Enums"]["stock_status"];
          updated_at?: string;
        };
        Update: {
          medication_id?: string;
          pharmacy_id?: string;
          stock_status?: Database["public"]["Enums"]["stock_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      pharmacy_members: {
        Row: { pharmacy_id: string; user_id: string };
        Insert: { pharmacy_id: string; user_id: string };
        Update: { pharmacy_id?: string; user_id?: string };
        Relationships: [];
      };
      price_snapshots: {
        Row: {
          aidcelix_price: number;
          currency: string;
          fetched_at: string;
          medication_id: string;
          medindex_base: number;
        };
        Insert: {
          aidcelix_price: number;
          currency: string;
          fetched_at?: string;
          medication_id: string;
          medindex_base: number;
        };
        Update: {
          aidcelix_price?: number;
          currency?: string;
          fetched_at?: string;
          medication_id?: string;
          medindex_base?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          country_code: string;
          created_at: string;
          full_name: string;
          id: string;
          phone: string | null;
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
        };
        Insert: {
          country_code?: string;
          created_at?: string;
          full_name: string;
          id: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Update: {
          country_code?: string;
          created_at?: string;
          full_name?: string;
          id?: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      medication_prices: {
        Row: {
          aidcelix_price: number | null;
          currency: string | null;
          fetched_at: string | null;
          medication_id: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      advance_delivery: {
        Args: { p_order_id: string };
        Returns: Database["public"]["Enums"]["delivery_status"];
      };
      complete_checkout_payment: {
        Args: {
          p_gozem_ref: string;
          p_method: Database["public"]["Enums"]["payment_method"];
          p_order_id: string;
          p_payment_ref: string;
          p_succeeded: boolean;
        };
        Returns: Database["public"]["Enums"]["order_status"];
      };
      get_medication: {
        Args: { p_lat?: number; p_lng?: number; p_slug: string };
        Returns: {
          aidcelix_price: number;
          brand: string;
          category: string;
          currency: string;
          dosage: string;
          generic_name: string;
          id: string;
          image: string;
          manufacturer: string;
          name: string;
          pharmacies: Json;
        }[];
      };
      get_pharmacy: {
        Args: { p_lat?: number; p_lng?: number; p_slug: string };
        Returns: {
          address: string;
          distance_km: number;
          hours: string;
          id: string;
          lat: number;
          lng: number;
          name: string;
          phone: string;
          prep_minutes: number;
          rating: number;
        }[];
      };
      list_categories: {
        Args: Record<PropertyKey, never>;
        Returns: { category: string }[];
      };
      list_nearby_pharmacies: {
        Args: { p_lat?: number; p_limit?: number; p_lng?: number };
        Returns: {
          address: string;
          distance_km: number;
          hours: string;
          id: string;
          lat: number;
          lng: number;
          name: string;
          phone: string;
          prep_minutes: number;
          rating: number;
        }[];
      };
      place_order: {
        Args: {
          p_dropoff_contact: string;
          p_dropoff_label: string;
          p_dropoff_lat: number;
          p_dropoff_lng: number;
          p_items: Json;
          p_pharmacy_slug: string;
        };
        Returns: string;
      };
      my_pharmacy: {
        Args: Record<PropertyKey, never>;
        Returns: {
          address: string;
          hours: string | null;
          id: string;
          lat: number;
          lng: number;
          name: string;
          phone: string | null;
          prep_minutes: number;
          rating: number;
          slug: string;
        }[];
      };
      upsert_my_pharmacy: {
        Args: {
          p_address: string;
          p_hours: string;
          p_lat: number;
          p_lng: number;
          p_name: string;
          p_phone: string;
          p_prep_minutes: number;
        };
        Returns: {
          address: string;
          hours: string | null;
          id: string;
          lat: number;
          lng: number;
          name: string;
          phone: string | null;
          prep_minutes: number;
          rating: number;
          slug: string;
        }[];
      };
      list_my_inventory: {
        Args: Record<PropertyKey, never>;
        Returns: {
          aidcelix_price: number | null;
          category: string;
          currency: string | null;
          dosage: string;
          generic_name: string;
          name: string;
          offered: boolean;
          slug: string;
          stock_status: Database["public"]["Enums"]["stock_status"];
        }[];
      };
      set_my_inventory: {
        Args: { p_items: Json };
        Returns: number;
      };
      set_my_stock_item: {
        Args: {
          p_offered: boolean;
          p_slug: string;
          p_stock_status?: Database["public"]["Enums"]["stock_status"];
        };
        Returns: {
          aidcelix_price: number | null;
          category: string;
          currency: string | null;
          dosage: string;
          generic_name: string;
          name: string;
          offered: boolean;
          slug: string;
          stock_status: Database["public"]["Enums"]["stock_status"];
        }[];
      };
      upsert_my_medication: {
        Args: {
          p_name: string;
          p_category: string;
          p_price: number;
          p_in_stock: boolean;
          p_generic_name?: string | null;
          p_dosage?: string | null;
          p_slug?: string | null;
        };
        Returns: {
          aidcelix_price: number;
          category: string;
          currency: string;
          dosage: string;
          generic_name: string;
          name: string;
          slug: string;
          stock_status: Database["public"]["Enums"]["stock_status"];
        }[];
      };
      claim_first_admin: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["user_role"];
      };
      admin_set_role: {
        Args: { p_role: Database["public"]["Enums"]["user_role"]; p_user_id: string };
        Returns: Database["public"]["Enums"]["user_role"];
      };
      admin_list_users: {
        Args: Record<PropertyKey, never>;
        Returns: {
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          phone: string | null;
          role: Database["public"]["Enums"]["user_role"];
        }[];
      };
      admin_overview: {
        Args: Record<PropertyKey, never>;
        Returns: {
          active_deliveries: number;
          cancelled_orders: number;
          customers: number;
          delivered_orders: number;
          failed_payments: number;
          gmv: number;
          medications: number;
          open_orders: number;
          orders: number;
          pending_payment: number;
          pharmacy_accounts: number;
          pharmacy_locations: number;
          users: number;
        }[];
      };
      admin_list_pharmacies: {
        Args: Record<PropertyKey, never>;
        Returns: {
          address: string;
          hours: string | null;
          id: string;
          member_count: number;
          name: string;
          order_count: number;
          owner_email: string | null;
          owner_id: string | null;
          owner_name: string | null;
          phone: string | null;
          prep_minutes: number;
          rating: number;
          slug: string;
          stocked_items: number;
        }[];
      };
      admin_assign_pharmacy: {
        Args: { p_pharmacy_id: string; p_user_id: string };
        Returns: undefined;
      };
      admin_update_pharmacy: {
        Args: {
          p_address: string;
          p_hours: string;
          p_name: string;
          p_pharmacy_id: string;
          p_phone: string;
          p_prep_minutes: number;
        };
        Returns: undefined;
      };
      admin_delete_user: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      admin_cancel_order: {
        Args: { p_order_id: string };
        Returns: Database["public"]["Enums"]["order_status"];
      };
      admin_set_price: {
        Args: { p_medication_id: string; p_price: number };
        Returns: number;
      };
      admin_list_activity: {
        Args: Record<PropertyKey, never>;
        Returns: {
          action: string;
          actor_name: string;
          created_at: string;
          id: number;
        }[];
      };
      search_catalog: {
        Args: { p_lat?: number; p_lng?: number; p_query?: string };
        Returns: {
          aidcelix_price: number;
          brand: string;
          category: string;
          currency: string;
          dosage: string;
          generic_name: string;
          id: string;
          image: string;
          manufacturer: string;
          name: string;
          pharmacies: Json;
        }[];
      };
    };
    Enums: {
      delivery_status:
        | "order_received"
        | "driver_assigned"
        | "pickup_in_progress"
        | "en_route"
        | "delivered";
      order_status:
        | "pending_payment"
        | "paid"
        | "notified_gozem"
        | "preparing"
        | "out_for_delivery"
        | "delivered"
        | "failed_payment"
        | "cancelled";
      payment_method: "orange" | "mtn";
      payment_status: "pending" | "succeeded" | "failed";
      stock_status: "in_stock" | "low_stock" | "out_of_stock";
      user_role: "customer" | "pharmacy" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
