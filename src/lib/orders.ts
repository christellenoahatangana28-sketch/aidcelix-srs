export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "notified_gozem"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "failed_payment"
  | "cancelled";

export type StoredOrder = {
  id: string;
  createdAt: string;
  status: OrderStatus;
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
  paymentMethod?: "orange" | "mtn";
  paymentRef?: string;
  gozemRef?: string;
  deliveryStatus?:
    | "order_received"
    | "driver_assigned"
    | "pickup_in_progress"
    | "en_route"
    | "delivered";
};

const KEY = "aidcelix.orders";

export function readOrders(): StoredOrder[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveOrder(order: StoredOrder) {
  const next = [order, ...readOrders().filter((item) => item.id !== order.id)];
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function getOrder(id: string) {
  return readOrders().find((item) => item.id === id) ?? null;
}
