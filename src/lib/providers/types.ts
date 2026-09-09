export type Geo = { lat: number; lng: number };

export type MedicationQuote = {
  id: string;
  name: string;
  genericName: string;
  brand: string;
  category: string;
  dosage: string;
  manufacturer: string;
  image: string;
  aidcelixPrice: number;
  currency: string;
};

export type PricingProvider = {
  search(query: string): Promise<MedicationQuote[]>;
  getById(id: string): Promise<MedicationQuote | null>;
  getInternalPrice(id: string): Promise<{
    medindexBase: number;
    aidcelixPrice: number;
    currency: string;
  } | null>;
};

export type PackageSpec = { weightKg: number; itemCount: number };

export type DeliveryQuote = {
  fee: number;
  currency: string;
  etaMinutes: number;
  distanceKm: number;
};

export type DeliveryRequest = {
  orderId: string;
  pickup: Geo & { label: string };
  dropoff: Geo & { label: string; contact: string };
  package: PackageSpec;
  items: { name: string; quantity: number }[];
};

export type DeliveryAck = {
  providerRef: string;
  status: DeliveryStatus;
};

export type DeliveryStatus =
  | "order_received"
  | "driver_assigned"
  | "pickup_in_progress"
  | "en_route"
  | "delivered";

export type DeliveryProvider = {
  quote(pickup: Geo, dropoff: Geo, pkg: PackageSpec): Promise<DeliveryQuote>;
  createDelivery(order: DeliveryRequest): Promise<DeliveryAck>;
};

export type PaymentMethod = "orange" | "mtn";

export type PaymentSession = {
  sessionId: string;
  method: PaymentMethod;
  amount: number;
  currency: string;
  collectTo: string;
  status: "pending" | "succeeded" | "failed";
  providerRef?: string;
};

export type PaymentProvider = {
  initiate(
    orderId: string,
    amount: number,
    currency: string,
    method: PaymentMethod,
    payerMsisdn: string,
  ): Promise<PaymentSession>;
  confirm(sessionId: string, succeed?: boolean): Promise<PaymentSession>;
};
