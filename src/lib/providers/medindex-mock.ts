import { COUNTRY, medications } from "@/data/catalog";
import { toAidcelixPrice } from "@/lib/pricing";
import type { MedicationQuote, PricingProvider } from "@/lib/providers/types";

function toQuote(med: (typeof medications)[number]): MedicationQuote {
  return {
    id: med.id,
    name: med.name,
    genericName: med.genericName,
    brand: med.brand,
    category: med.category,
    dosage: med.dosage,
    manufacturer: med.manufacturer,
    image: med.image,
    aidcelixPrice: toAidcelixPrice(med.medindexBase),
    currency: COUNTRY.currency,
  };
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export const medindexMock: PricingProvider = {
  async search(query: string) {
    const q = normalize(query.trim());
    if (!q) return medications.map(toQuote);
    return medications
      .filter((med) =>
        [med.name, med.genericName, med.brand, med.category].some((field) =>
          normalize(field).includes(q),
        ),
      )
      .map(toQuote);
  },

  async getById(id: string) {
    const med = medications.find((item) => item.id === id);
    return med ? toQuote(med) : null;
  },

  async getInternalPrice(id: string) {
    const med = medications.find((item) => item.id === id);
    if (!med) return null;
    return {
      medindexBase: med.medindexBase,
      aidcelixPrice: toAidcelixPrice(med.medindexBase),
      currency: COUNTRY.currency,
    };
  },
};
