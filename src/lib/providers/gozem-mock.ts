import { haversineKm, type GeoPoint } from "@/lib/geo";
import type { DeliveryAck, DeliveryProvider, DeliveryStatus } from "@/lib/providers/types";
import { COUNTRY } from "@/data/catalog";

const STATUS_FLOW: DeliveryStatus[] = [
  "order_received",
  "driver_assigned",
  "pickup_in_progress",
  "en_route",
  "delivered",
];

export const gozemMock: DeliveryProvider = {
  async quote(pickup, dropoff, pkg) {
    const distanceKm = haversineKm(pickup as GeoPoint, dropoff as GeoPoint);
    const base = 800;
    const perKm = 250;
    const weightFee = Math.max(0, pkg.weightKg - 0.5) * 200;
    const fee = Math.round(base + distanceKm * perKm + weightFee);
    return {
      fee,
      currency: COUNTRY.currency,
      etaMinutes: Math.max(25, Math.round(18 + distanceKm * 6)),
      distanceKm: Number(distanceKm.toFixed(2)),
    };
  },

  async createDelivery() {
    return {
      providerRef: `GZ-${Date.now()}`,
      status: "order_received",
    } satisfies DeliveryAck;
  },
};

export function nextDeliveryStatus(current: DeliveryStatus): DeliveryStatus {
  const index = STATUS_FLOW.indexOf(current);
  return STATUS_FLOW[Math.min(index + 1, STATUS_FLOW.length - 1)];
}

export { STATUS_FLOW };
