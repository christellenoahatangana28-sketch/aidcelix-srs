"use client";

import { pharmacies } from "@/data/catalog";
import { nearbyPharmacies } from "@/lib/catalog-query";
import { formatDistance } from "@/lib/geo";
import { useLocation } from "@/components/location/location-provider";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function PharmacyPage() {
  const { id } = useParams<{ id: string }>();
  const { coords } = useLocation();
  const pharmacy = nearbyPharmacies(coords).find((item) => item.id === id) ?? pharmacies.find((item) => item.id === id);

  if (!pharmacy) return <div className="px-6 py-16">Pharmacy not found.</div>;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold text-white">{pharmacy.name}</h1>
      <p className="mt-2 text-gray-400">{pharmacy.address}</p>
      <p className="mt-1 text-sm text-gray-500">
        {"distanceKm" in pharmacy ? formatDistance(Number(pharmacy.distanceKm)) : null} · {pharmacy.hours} · {pharmacy.phone}
      </p>
      <p className="mt-4 text-gray-300">Rating {pharmacy.rating} · Preparation about {pharmacy.prepMinutes} minutes.</p>
      <Link href="/search" className="mt-8 inline-block rounded-xl bg-emerald-500 px-5 py-3 font-bold text-black">
        Search medications here
      </Link>
    </div>
  );
}
