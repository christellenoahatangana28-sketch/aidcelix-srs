import { createClient } from "@/lib/supabase/client";
import type { Pharmacy, StockStatus } from "@/data/catalog";
import type { GeoPoint } from "@/lib/geo";
import type { MedicationQuote } from "@/lib/providers/types";

export type NearbyPharmacy = Pharmacy & {
  distanceKm: number;
  stockStatus: StockStatus;
};

export type SearchHit = MedicationQuote & {
  pharmacies: NearbyPharmacy[];
};

type CatalogRow = {
  id: string;
  name: string;
  generic_name: string;
  brand: string;
  category: string;
  dosage: string;
  manufacturer: string;
  image: string;
  aidcelix_price: number | string;
  currency: string;
  pharmacies: NearbyPharmacy[] | string | null;
};

type PharmacyRow = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  hours: string | null;
  rating: number | string;
  prep_minutes: number;
  lat: number;
  lng: number;
  distance_km: number | string;
};

function asNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function originKey(origin: GeoPoint | null) {
  if (!origin) return "none";
  return `${origin.lat.toFixed(3)},${origin.lng.toFixed(3)}`;
}

const searchCache = new Map<string, SearchHit[]>();
const medicationCache = new Map<string, SearchHit>();
const pharmacyCache = new Map<string, Pharmacy & { distanceKm: number }>();
const nearbyCache = new Map<string, (Pharmacy & { distanceKm: number })[]>();
const categoryCache: { value: string[] | null } = { value: null };

function rememberHits(hits: SearchHit[]) {
  hits.forEach((hit) => medicationCache.set(hit.id, hit));
}

export function peekSearch(query: string, origin: GeoPoint | null) {
  return searchCache.get(`${query}|${originKey(origin)}`) ?? null;
}

export function peekMedication(id: string) {
  return medicationCache.get(id) ?? null;
}

export function peekPharmacy(slug: string) {
  return pharmacyCache.get(slug) ?? null;
}

export function peekNearby(origin: GeoPoint | null) {
  return nearbyCache.get(originKey(origin)) ?? null;
}

export function peekCategories() {
  return categoryCache.value ?? [];
}

function mapPharmacies(raw: CatalogRow["pharmacies"]): NearbyPharmacy[] {
  const parsed = typeof raw === "string" ? (JSON.parse(raw) as NearbyPharmacy[]) : (raw ?? []);
  return parsed.map((pharmacy) => ({
    ...pharmacy,
    phone: pharmacy.phone ?? "",
    hours: pharmacy.hours ?? "",
    rating: asNumber(pharmacy.rating),
    distanceKm: asNumber(pharmacy.distanceKm),
    stockStatus: pharmacy.stockStatus,
  }));
}

function mapHit(row: CatalogRow): SearchHit {
  return {
    id: row.id,
    name: row.name,
    genericName: row.generic_name,
    brand: row.brand,
    category: row.category,
    dosage: row.dosage,
    manufacturer: row.manufacturer,
    image: row.image,
    aidcelixPrice: asNumber(row.aidcelix_price),
    currency: row.currency,
    pharmacies: mapPharmacies(row.pharmacies),
  };
}

function mapPharmacy(row: PharmacyRow): Pharmacy & { distanceKm: number } {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    phone: row.phone ?? "",
    hours: row.hours ?? "",
    rating: asNumber(row.rating),
    prepMinutes: row.prep_minutes,
    lat: asNumber(row.lat),
    lng: asNumber(row.lng),
    distanceKm: asNumber(row.distance_km),
  };
}

export async function searchMedications(
  query: string,
  origin: GeoPoint | null,
): Promise<SearchHit[]> {
  const key = `${query}|${originKey(origin)}`;
  const cached = searchCache.get(key);
  if (cached) return cached;

  const supabase = createClient();
  const { data, error } = await supabase.rpc("search_catalog", {
    p_query: query,
    p_lat: origin?.lat,
    p_lng: origin?.lng,
  });
  if (error) throw error;
  const hits = (data ?? []).map((row) => mapHit(row as CatalogRow));
  searchCache.set(key, hits);
  rememberHits(hits);
  return hits;
}

export async function getMedication(
  id: string,
  origin: GeoPoint | null,
): Promise<SearchHit | null> {
  const cached = medicationCache.get(id);
  if (cached) return cached;

  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_medication", {
    p_slug: id,
    p_lat: origin?.lat,
    p_lng: origin?.lng,
  });
  if (error) throw error;
  const row = data?.[0];
  const hit = row ? mapHit(row as CatalogRow) : null;
  if (hit) medicationCache.set(id, hit);
  return hit;
}

export async function nearbyPharmacies(
  origin: GeoPoint | null,
): Promise<(Pharmacy & { distanceKm: number })[]> {
  const key = originKey(origin);
  const cached = nearbyCache.get(key);
  if (cached) return cached;

  const supabase = createClient();
  const { data, error } = await supabase.rpc("list_nearby_pharmacies", {
    p_lat: origin?.lat,
    p_lng: origin?.lng,
    p_limit: 20,
  });
  if (error) throw error;
  const rows = (data ?? []).map((row) => mapPharmacy(row as PharmacyRow));
  nearbyCache.set(key, rows);
  rows.forEach((row) => pharmacyCache.set(row.id, row));
  return rows;
}

export async function getPharmacy(
  slug: string,
  origin: GeoPoint | null,
): Promise<(Pharmacy & { distanceKm: number }) | null> {
  const cached = pharmacyCache.get(slug);
  if (cached) return cached;

  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_pharmacy", {
    p_slug: slug,
    p_lat: origin?.lat,
    p_lng: origin?.lng,
  });
  if (error) throw error;
  const row = data?.[0];
  const pharmacy = row ? mapPharmacy(row as PharmacyRow) : null;
  if (pharmacy) pharmacyCache.set(slug, pharmacy);
  return pharmacy;
}

export async function listCategories(): Promise<string[]> {
  if (categoryCache.value) return categoryCache.value;
  const supabase = createClient();
  const { data, error } = await supabase.rpc("list_categories");
  if (error) throw error;
  const categories = (data ?? []).map((row) => row.category);
  categoryCache.value = categories;
  return categories;
}
