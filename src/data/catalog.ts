export { COUNTRY } from "@/lib/country";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

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
