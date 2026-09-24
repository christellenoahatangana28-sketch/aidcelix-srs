"use client";

import { getPharmacy, peekPharmacy } from "@/lib/catalog-query";
import { formatDistance } from "@/lib/geo";
import { useLocation } from "@/components/location/location-provider";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Pharmacy } from "@/data/catalog";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useI18n } from "@/components/i18n";

export default function PharmacyPage() {
  const { id } = useParams<{ id: string }>();
  const { coords } = useLocation();
  const { t, tx } = useI18n();
  const [pharmacy, setPharmacy] = useState<(Pharmacy & { distanceKm: number }) | null>(() => peekPharmacy(id));

  useEffect(() => {
    setPharmacy(peekPharmacy(id));
    getPharmacy(id, coords).then(setPharmacy);
  }, [id, coords]);

  if (!pharmacy) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold text-white">{t.pharmacy}</h1>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold text-white">{pharmacy.name}</h1>
      <p className="mt-2 text-gray-400">{pharmacy.address}</p>
      <p className="mt-1 text-sm text-gray-500">
        {formatDistance(pharmacy.distanceKm)} · {pharmacy.hours} · {pharmacy.phone}
      </p>
      <p className="mt-4 text-gray-300">{tx("prepAbout", { rating: pharmacy.rating, minutes: pharmacy.prepMinutes })}</p>
      <Link href="/search" prefetch data-press className={cn("mt-8", buttonStyles())}>
        {t.searchMedicationsHere}
      </Link>
    </div>
  );
}
