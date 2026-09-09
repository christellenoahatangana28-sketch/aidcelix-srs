import { inventory, medications, pharmacies, type Pharmacy, type StockStatus } from "@/data/catalog";
import { DEFAULT_RADIUS_KM, EXPANDED_RADIUS_KM, haversineKm, type GeoPoint } from "@/lib/geo";
import { getPricingProvider } from "@/lib/providers";
import type { MedicationQuote } from "@/lib/providers/types";

export type NearbyPharmacy = Pharmacy & {
  distanceKm: number;
  stockStatus: StockStatus;
};

export type SearchHit = MedicationQuote & {
  pharmacies: NearbyPharmacy[];
};

export async function searchMedications(
  query: string,
  origin: GeoPoint | null,
): Promise<SearchHit[]> {
  const quotes = await getPricingProvider().search(query);
  return quotes.map((quote) => ({
    ...quote,
    pharmacies: nearbyStock(quote.id, origin),
  }));
}

export async function getMedication(
  id: string,
  origin: GeoPoint | null,
): Promise<SearchHit | null> {
  const quote = await getPricingProvider().getById(id);
  if (!quote) return null;
  return { ...quote, pharmacies: nearbyStock(id, origin) };
}

export function nearbyPharmacies(origin: GeoPoint | null): (Pharmacy & { distanceKm: number })[] {
  const list = pharmacies.map((pharmacy) => ({
    ...pharmacy,
    distanceKm: origin ? haversineKm(origin, pharmacy) : 0,
  }));
  return origin ? list.sort((a, b) => a.distanceKm - b.distanceKm) : list;
}

function nearbyStock(medicationId: string, origin: GeoPoint | null): NearbyPharmacy[] {
  const rows = inventory.filter(
    (row) => row.medicationId === medicationId && row.stockStatus !== "out_of_stock",
  );

  const mapped = rows
    .map((row) => {
      const pharmacy = pharmacies.find((item) => item.id === row.pharmacyId);
      if (!pharmacy) return null;
      const distanceKm = origin ? haversineKm(origin, pharmacy) : 0;
      return { ...pharmacy, distanceKm, stockStatus: row.stockStatus };
    })
    .filter((row): row is NearbyPharmacy => row !== null)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  if (!origin) return mapped;

  const within = mapped.filter((item) => item.distanceKm <= DEFAULT_RADIUS_KM);
  if (within.length > 0) return within;
  return mapped.filter((item) => item.distanceKm <= EXPANDED_RADIUS_KM);
}
