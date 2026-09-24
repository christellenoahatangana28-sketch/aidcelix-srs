import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import type { PaymentMethod } from "@/lib/providers/types";

export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type DeliveryStatus = Database["public"]["Enums"]["delivery_status"];

export type StoredOrder = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  pickupCode: string;
  customerName?: string;
  pharmacyId: string;
  pharmacyName: string;
  pickup: { lat: number; lng: number; label: string };
  dropoff: { lat: number; lng: number; label: string; contact: string };
  items: {
    id: string;
    name: string;
    quantity: number;
    aidcelixPrice: number;
    platformFee: number;
    pharmacyDue: number;
  }[];
  medTotal: number;
  platformFee: number;
  pharmacyDue: number;
  deliveryFee: number;
  grandTotal: number;
  currency: string;
  paymentMethod?: PaymentMethod;
  paymentRef?: string;
  gozemRef?: string;
  deliveryStatus?: DeliveryStatus;
};

type OrderRow = {
  id: string;
  created_at: string;
  status: OrderStatus;
  pickup_code: string;
  customer_name: string | null;
  pharmacy_id: string;
  profiles: { full_name: string } | null;
  med_total: number | string;
  platform_fee: number | string;
  pharmacy_due: number | string;
  delivery_fee: number | string;
  grand_total: number | string;
  currency: string;
  dropoff_label: string;
  dropoff_lat: number;
  dropoff_lng: number;
  dropoff_contact: string;
  pharmacies: {
    slug: string;
    name: string;
    lat: number;
    lng: number;
  } | null;
  order_items: {
    id: string;
    medication_name: string;
    quantity: number;
    aidcelix_unit_price: number | string;
    platform_fee: number | string;
    pharmacy_due: number | string;
    medications: { slug: string } | null;
  }[];
  payments: {
    method: PaymentMethod;
    provider_ref: string | null;
    status: string;
  }[];
  deliveries:
    | {
        provider_ref: string | null;
        status: DeliveryStatus;
      }
    | {
        provider_ref: string | null;
        status: DeliveryStatus;
      }[]
    | null;
};

function asNumber(value: number | string) {
  return Number(value);
}

function firstDelivery(value: OrderRow["deliveries"]) {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function mapOrder(row: OrderRow): StoredOrder {
  const payment = [...(row.payments ?? [])].reverse().find((item) => item.status === "succeeded")
    ?? row.payments?.[0];
  const delivery = firstDelivery(row.deliveries);
  return {
    id: row.id,
    createdAt: row.created_at,
    status: row.status,
    pickupCode: row.pickup_code,
    customerName: row.customer_name || row.profiles?.full_name,
    pharmacyId: row.pharmacies?.slug ?? row.pharmacy_id,
    pharmacyName: row.pharmacies?.name ?? "Pharmacy",
    pickup: {
      lat: row.pharmacies?.lat ?? 0,
      lng: row.pharmacies?.lng ?? 0,
      label: row.pharmacies?.name ?? "Pharmacy",
    },
    dropoff: {
      lat: row.dropoff_lat,
      lng: row.dropoff_lng,
      label: row.dropoff_label,
      contact: row.dropoff_contact,
    },
    items: (row.order_items ?? []).map((item) => ({
      id: item.medications?.slug ?? item.id,
      name: item.medication_name,
      quantity: item.quantity,
      aidcelixPrice: asNumber(item.aidcelix_unit_price),
      platformFee: asNumber(item.platform_fee),
      pharmacyDue: asNumber(item.pharmacy_due),
    })),
    medTotal: asNumber(row.med_total),
    platformFee: asNumber(row.platform_fee),
    pharmacyDue: asNumber(row.pharmacy_due),
    deliveryFee: asNumber(row.delivery_fee),
    grandTotal: asNumber(row.grand_total),
    currency: row.currency,
    paymentMethod: payment?.method,
    paymentRef: payment?.provider_ref ?? undefined,
    gozemRef: delivery?.provider_ref ?? undefined,
    deliveryStatus: delivery?.status,
  };
}

const ORDER_SELECT = `
  id,
  created_at,
  status,
  pickup_code,
  customer_name,
  pharmacy_id,
  profiles ( full_name ),
  med_total,
  platform_fee,
  pharmacy_due,
  delivery_fee,
  grand_total,
  currency,
  dropoff_label,
  dropoff_lat,
  dropoff_lng,
  dropoff_contact,
  pharmacies ( slug, name, lat, lng ),
  order_items (
    id,
    medication_name,
    quantity,
    aidcelix_unit_price,
    platform_fee,
    pharmacy_due,
    medications ( slug )
  ),
  payments ( method, provider_ref, status ),
  deliveries ( provider_ref, status )
`;

export async function listOrders(userId: string): Promise<StoredOrder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as OrderRow[]).map(mapOrder);
}

export async function listPharmacyOrders(pharmacyId: string): Promise<StoredOrder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("pharmacy_id", pharmacyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as OrderRow[]).map(mapOrder);
}

export async function listAllOrders(): Promise<StoredOrder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as OrderRow[]).map(mapOrder);
}

export async function getOrder(id: string): Promise<StoredOrder | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapOrder(data as unknown as OrderRow) : null;
}

export async function placeOrder(input: {
  pharmacySlug: string;
  items: { slug: string; quantity: number }[];
  dropoffLabel: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffContact: string;
}): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("place_order", {
    p_pharmacy_slug: input.pharmacySlug,
    p_items: input.items,
    p_dropoff_label: input.dropoffLabel,
    p_dropoff_lat: input.dropoffLat,
    p_dropoff_lng: input.dropoffLng,
    p_dropoff_contact: input.dropoffContact,
  });
  if (error) throw error;
  return data;
}

export async function completePayment(input: {
  orderId: string;
  method: PaymentMethod;
  succeeded: boolean;
  paymentRef: string;
  gozemRef: string;
}): Promise<OrderStatus> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("complete_checkout_payment", {
    p_order_id: input.orderId,
    p_method: input.method,
    p_succeeded: input.succeeded,
    p_payment_ref: input.paymentRef,
    p_gozem_ref: input.gozemRef,
  });
  if (error) throw error;
  return data;
}

export async function advanceDelivery(orderId: string): Promise<DeliveryStatus> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("advance_delivery", {
    p_order_id: orderId,
  });
  if (error) throw error;
  return data;
}
