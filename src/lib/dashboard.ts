import { createClient } from "@/lib/supabase/client";
import type { Database, Json } from "@/lib/supabase/database.types";

export type UserRole = Database["public"]["Enums"]["user_role"];
export type StockStatus = Database["public"]["Enums"]["stock_status"];

export type ManagedPharmacy = {
  id: string;
  slug: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  prepMinutes: number;
  lat: number;
  lng: number;
  rating: number;
};

export type InventoryRow = {
  slug: string;
  name: string;
  genericName: string;
  category: string;
  dosage: string;
  offered: boolean;
  stockStatus: StockStatus;
  aidcelixPrice: number;
  currency: string;
};

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: string;
};

export type AdminOverview = {
  users: number;
  customers: number;
  pharmacyAccounts: number;
  pharmacyLocations: number;
  medications: number;
  orders: number;
  openOrders: number;
  pendingPayment: number;
  activeDeliveries: number;
  deliveredOrders: number;
  cancelledOrders: number;
  failedPayments: number;
  gmv: number;
};

export type AdminPharmacy = {
  id: string;
  slug: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  prepMinutes: number;
  rating: number;
  ownerId: string | null;
  ownerName: string;
  ownerEmail: string;
  memberCount: number;
  stockedItems: number;
  orderCount: number;
};

export type AdminActivity = {
  id: number;
  actorName: string;
  action: string;
  createdAt: string;
};

export type AdminCatalogRow = {
  id: string;
  slug: string;
  name: string;
  genericName: string;
  category: string;
  dosage: string;
  aidcelixPrice: number;
  currency: string;
};

function mapPharmacy(row: {
  id: string;
  slug: string;
  name: string;
  address: string;
  phone: string | null;
  hours: string | null;
  prep_minutes: number;
  lat: number;
  lng: number;
  rating: number;
}): ManagedPharmacy {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    address: row.address,
    phone: row.phone ?? "",
    hours: row.hours ?? "",
    prepMinutes: row.prep_minutes,
    lat: row.lat,
    lng: row.lng,
    rating: Number(row.rating),
  };
}

export async function getMyPharmacy(): Promise<ManagedPharmacy | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("my_pharmacy");
  if (error) throw error;
  const row = data?.[0];
  return row ? mapPharmacy(row) : null;
}

export async function saveMyPharmacy(input: {
  name: string;
  address: string;
  phone: string;
  hours: string;
  prepMinutes: number;
  lat: number;
  lng: number;
}): Promise<ManagedPharmacy> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("upsert_my_pharmacy", {
    p_name: input.name,
    p_address: input.address,
    p_phone: input.phone,
    p_hours: input.hours,
    p_prep_minutes: input.prepMinutes,
    p_lat: input.lat,
    p_lng: input.lng,
  });
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error("Could not save pharmacy");
  return mapPharmacy(row);
}

export async function listMyInventory(): Promise<InventoryRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("list_my_inventory");
  if (error) throw error;
  return (data ?? []).map(mapInventoryRow);
}

export async function saveMyInventory(
  items: { slug: string; offered: boolean; stockStatus: StockStatus }[],
): Promise<number> {
  const supabase = createClient();
  const payload: Json = items.map((item) => ({
    slug: item.slug,
    offered: item.offered,
    stock_status: item.stockStatus,
  }));
  const { data, error } = await supabase.rpc("set_my_inventory", { p_items: payload });
  if (error) throw error;
  return data ?? 0;
}

export async function setMyStockItem(
  slug: string,
  offered: boolean,
  stockStatus: StockStatus = "in_stock",
): Promise<InventoryRow> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("set_my_stock_item", {
    p_slug: slug,
    p_offered: offered,
    p_stock_status: stockStatus,
  });
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error("Could not save stock");
  return mapInventoryRow(row);
}

export async function addMyMedication(input: {
  name: string;
  category: string;
  price: number;
  inStock: boolean;
  genericName?: string;
  dosage?: string;
}): Promise<InventoryRow> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("upsert_my_medication", {
    p_name: input.name,
    p_category: input.category,
    p_price: input.price,
    p_in_stock: input.inStock,
    p_generic_name: input.genericName || null,
    p_dosage: input.dosage || null,
  });
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error("Could not add medication");
  return mapInventoryRow(row);
}

function mapInventoryRow(row: {
  slug: string;
  name: string;
  generic_name: string;
  category: string;
  dosage: string;
  offered?: boolean | null;
  stock_status: StockStatus;
  aidcelix_price: number | null;
  currency: string | null;
}): InventoryRow {
  return {
    slug: row.slug,
    name: row.name,
    genericName: row.generic_name,
    category: row.category,
    dosage: row.dosage,
    offered: Boolean(row.offered),
    stockStatus: row.stock_status,
    aidcelixPrice: Number(row.aidcelix_price ?? 0),
    currency: row.currency ?? "XAF",
  };
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("admin_overview");
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error("Not authorized");
  return {
    users: Number(row.users),
    customers: Number(row.customers),
    pharmacyAccounts: Number(row.pharmacy_accounts),
    pharmacyLocations: Number(row.pharmacy_locations),
    medications: Number(row.medications),
    orders: Number(row.orders),
    openOrders: Number(row.open_orders),
    pendingPayment: Number(row.pending_payment),
    activeDeliveries: Number(row.active_deliveries),
    deliveredOrders: Number(row.delivered_orders),
    cancelledOrders: Number(row.cancelled_orders),
    failedPayments: Number(row.failed_payments),
    gmv: Number(row.gmv),
  };
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("admin_list_users");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    role: row.role,
    createdAt: row.created_at,
  }));
}

export async function listAdminPharmacies(): Promise<AdminPharmacy[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("admin_list_pharmacies");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    address: row.address,
    phone: row.phone ?? "",
    hours: row.hours ?? "",
    prepMinutes: row.prep_minutes,
    rating: Number(row.rating),
    ownerId: row.owner_id,
    ownerName: row.owner_name ?? "",
    ownerEmail: row.owner_email ?? "",
    memberCount: Number(row.member_count),
    stockedItems: Number(row.stocked_items),
    orderCount: Number(row.order_count),
  }));
}

export async function assignPharmacyOwner(pharmacyId: string, userId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("admin_assign_pharmacy", {
    p_pharmacy_id: pharmacyId,
    p_user_id: userId,
  });
  if (error) throw error;
}

export async function updateAdminPharmacy(input: {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  prepMinutes: number;
}) {
  const supabase = createClient();
  const { error } = await supabase.rpc("admin_update_pharmacy", {
    p_pharmacy_id: input.id,
    p_name: input.name,
    p_address: input.address,
    p_phone: input.phone,
    p_hours: input.hours,
    p_prep_minutes: input.prepMinutes,
  });
  if (error) throw error;
}

export async function cancelAdminOrder(orderId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("admin_cancel_order", { p_order_id: orderId });
  if (error) throw error;
  return data;
}

export async function listAdminActivity(): Promise<AdminActivity[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("admin_list_activity");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: Number(row.id),
    actorName: row.actor_name,
    action: row.action,
    createdAt: row.created_at,
  }));
}

export async function listAdminCatalog(): Promise<AdminCatalogRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("medications")
    .select("id, slug, name, generic_name, category, dosage, price_snapshots ( aidcelix_price, currency )")
    .order("name");
  if (error) throw error;
  type CatalogJoin = {
    id: string;
    slug: string;
    name: string;
    generic_name: string;
    category: string;
    dosage: string;
    price_snapshots:
      | { aidcelix_price: number | string; currency: string }
      | { aidcelix_price: number | string; currency: string }[]
      | null;
  };
  return ((data ?? []) as unknown as CatalogJoin[]).map((row) => {
    const price = Array.isArray(row.price_snapshots) ? row.price_snapshots[0] : row.price_snapshots;
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      genericName: row.generic_name,
      category: row.category,
      dosage: row.dosage,
      aidcelixPrice: Number(price?.aidcelix_price ?? 0),
      currency: price?.currency ?? "XAF",
    };
  });
}

export async function setAdminPrice(medicationId: string, price: number) {
  const supabase = createClient();
  const { error } = await supabase.rpc("admin_set_price", {
    p_medication_id: medicationId,
    p_price: price,
  });
  if (error) throw error;
}

export async function deleteAdminUser(userId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("admin_delete_user", { p_user_id: userId });
  if (error) throw error;
}

export async function setUserRole(userId: string, role: UserRole): Promise<UserRole> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("admin_set_role", {
    p_user_id: userId,
    p_role: role,
  });
  if (error) throw error;
  return data;
}

export async function claimFirstAdmin(): Promise<UserRole> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("claim_first_admin");
  if (error) throw error;
  return data;
}

export function dashboardHome(role: UserRole) {
  if (role === "admin") return "/admin";
  if (role === "pharmacy") return "/dashboard/pharmacy";
  return "/dashboard/user";
}
