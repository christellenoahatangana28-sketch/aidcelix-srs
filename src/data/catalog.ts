export const COUNTRY = {
  code: "CM",
  name: "Cameroon",
  currency: "XAF",
  locale: "fr-CM",
} as const;

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export type Medication = {
  id: string;
  name: string;
  genericName: string;
  brand: string;
  category: string;
  dosage: string;
  manufacturer: string;
  image: string;
  medindexBase: number;
};

export type Pharmacy = {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  rating: number;
  prepMinutes: number;
  lat: number;
  lng: number;
};

export type InventoryRow = {
  pharmacyId: string;
  medicationId: string;
  stockStatus: StockStatus;
};

export const CATEGORIES = [
  "Pain relief",
  "Antibiotics",
  "Malaria",
  "Digestive",
  "Allergy",
  "Diabetes",
  "Vitamins",
] as const;

export const medications: Medication[] = [
  {
    id: "med-para-500",
    name: "Paracetamol 500mg",
    genericName: "Paracetamol",
    brand: "Doliprane",
    category: "Pain relief",
    dosage: "500 mg, 16 tablets",
    manufacturer: "Sanofi",
    image: "/meds/paracetamol.svg",
    medindexBase: 1200,
  },
  {
    id: "med-ibu-400",
    name: "Ibuprofen 400mg",
    genericName: "Ibuprofen",
    brand: "Nurofen",
    category: "Pain relief",
    dosage: "400 mg, 20 tablets",
    manufacturer: "Reckitt",
    image: "/meds/ibuprofen.svg",
    medindexBase: 2800,
  },
  {
    id: "med-amox-500",
    name: "Amoxicillin 500mg",
    genericName: "Amoxicillin",
    brand: "Clamoxyl",
    category: "Antibiotics",
    dosage: "500 mg, 12 capsules",
    manufacturer: "GSK",
    image: "/meds/amoxicillin.svg",
    medindexBase: 4500,
  },
  {
    id: "med-coartem",
    name: "Artemether / Lumefantrine",
    genericName: "Artemether + Lumefantrine",
    brand: "Coartem",
    category: "Malaria",
    dosage: "80/480 mg, 6 tablets",
    manufacturer: "Novartis",
    image: "/meds/malaria.svg",
    medindexBase: 3200,
  },
  {
    id: "med-asaq",
    name: "Artesunate / Amodiaquine",
    genericName: "Artesunate + Amodiaquine",
    brand: "Winthrop",
    category: "Malaria",
    dosage: "Adult pack, 12 tablets",
    manufacturer: "Sanofi",
    image: "/meds/malaria.svg",
    medindexBase: 2100,
  },
  {
    id: "med-omep-20",
    name: "Omeprazole 20mg",
    genericName: "Omeprazole",
    brand: "Mopral",
    category: "Digestive",
    dosage: "20 mg, 14 capsules",
    manufacturer: "AstraZeneca",
    image: "/meds/omeprazole.svg",
    medindexBase: 3600,
  },
  {
    id: "med-ceti-10",
    name: "Cetirizine 10mg",
    genericName: "Cetirizine",
    brand: "Zyrtec",
    category: "Allergy",
    dosage: "10 mg, 10 tablets",
    manufacturer: "UCB",
    image: "/meds/cetirizine.svg",
    medindexBase: 1800,
  },
  {
    id: "med-metf-850",
    name: "Metformin 850mg",
    genericName: "Metformin",
    brand: "Glucophage",
    category: "Diabetes",
    dosage: "850 mg, 30 tablets",
    manufacturer: "Merck",
    image: "/meds/metformin.svg",
    medindexBase: 5400,
  },
  {
    id: "med-vitc",
    name: "Vitamin C 500mg",
    genericName: "Ascorbic acid",
    brand: "Laroscorbine",
    category: "Vitamins",
    dosage: "500 mg, 20 tablets",
    manufacturer: "Bayer",
    image: "/meds/vitamin.svg",
    medindexBase: 1500,
  },
  {
    id: "med-ors",
    name: "ORS sachets",
    genericName: "Oral rehydration salts",
    brand: "WHO-ORS",
    category: "Digestive",
    dosage: "20.5 g, 10 sachets",
    manufacturer: "UNICEF formula",
    image: "/meds/ors.svg",
    medindexBase: 900,
  },
  {
    id: "med-aspirin",
    name: "Aspirin 500mg",
    genericName: "Acetylsalicylic acid",
    brand: "Aspégic",
    category: "Pain relief",
    dosage: "500 mg, 20 sachets",
    manufacturer: "Sanofi",
    image: "/meds/aspirin.svg",
    medindexBase: 1600,
  },
  {
    id: "med-azith",
    name: "Azithromycin 500mg",
    genericName: "Azithromycin",
    brand: "Zithromax",
    category: "Antibiotics",
    dosage: "500 mg, 3 tablets",
    manufacturer: "Pfizer",
    image: "/meds/azithromycin.svg",
    medindexBase: 6200,
  },
];

export const pharmacies: Pharmacy[] = [
  {
    id: "ph-akwa",
    name: "Pharmacie d'Akwa",
    address: "Boulevard de la Liberté, Akwa, Douala",
    phone: "+237 233 42 11 20",
    hours: "07:00 – 22:00",
    rating: 4.7,
    prepMinutes: 15,
    lat: 4.0511,
    lng: 9.7679,
  },
  {
    id: "ph-bonanjo",
    name: "Pharmacie du Centre Bonanjo",
    address: "Rue Joss, Bonanjo, Douala",
    phone: "+237 233 42 88 10",
    hours: "08:00 – 20:00",
    rating: 4.5,
    prepMinutes: 20,
    lat: 4.0398,
    lng: 9.6871,
  },
  {
    id: "ph-deido",
    name: "Pharmacie de Deido",
    address: "Carrefour Deido, Douala",
    phone: "+237 233 40 21 55",
    hours: "07:30 – 21:00",
    rating: 4.4,
    prepMinutes: 12,
    lat: 4.0665,
    lng: 9.7082,
  },
  {
    id: "ph-bonapriso",
    name: "Pharmacie Bonapriso",
    address: "Rue des Palmiers, Bonapriso, Douala",
    phone: "+237 233 42 60 44",
    hours: "08:00 – 21:30",
    rating: 4.8,
    prepMinutes: 18,
    lat: 4.0214,
    lng: 9.7376,
  },
  {
    id: "ph-makepe",
    name: "Pharmacie Makepe",
    address: "Carrefour Makepe, Douala",
    phone: "+237 233 47 19 02",
    hours: "08:00 – 20:00",
    rating: 4.2,
    prepMinutes: 25,
    lat: 4.0789,
    lng: 9.7612,
  },
  {
    id: "ph-bali",
    name: "Pharmacie Bali",
    address: "Quartier Bali, Douala",
    phone: "+237 233 42 33 90",
    hours: "24/7",
    rating: 4.6,
    prepMinutes: 10,
    lat: 4.0482,
    lng: 9.7015,
  },
];

const statuses: StockStatus[] = ["in_stock", "in_stock", "low_stock", "out_of_stock"];

export const inventory: InventoryRow[] = pharmacies.flatMap((pharmacy, pIndex) =>
  medications.map((med, mIndex) => ({
    pharmacyId: pharmacy.id,
    medicationId: med.id,
    stockStatus: statuses[(pIndex + mIndex) % statuses.length],
  })),
);
