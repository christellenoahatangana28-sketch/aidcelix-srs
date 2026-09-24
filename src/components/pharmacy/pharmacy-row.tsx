"use client";

import { Clock, MapPin, Phone, Star } from "lucide-react";
import { formatDistance } from "@/lib/geo";
import type { NearbyPharmacy } from "@/lib/catalog-query";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n";

export function PharmacyRow({
  pharmacy,
  onOrder,
}: {
  pharmacy: NearbyPharmacy;
  onOrder: () => void;
}) {
  const { t } = useI18n();
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white">{pharmacy.name}</h3>
          <span className="inline-flex items-center gap-1 text-xs text-amber-300">
            <Star className="h-3 w-3 fill-amber-300" /> {pharmacy.rating}
          </span>
        </div>
        <p className="mt-1 flex items-center gap-1 text-sm text-gray-400">
          <MapPin className="h-3.5 w-3.5" /> {pharmacy.address} · {formatDistance(pharmacy.distanceKm)}
        </p>
        <p className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Phone className="h-3 w-3" /> {pharmacy.phone}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {pharmacy.hours} · ~{pharmacy.prepMinutes} min
          </span>
          <span className={pharmacy.stockStatus === "low_stock" ? "text-amber-400" : "text-emerald-400"}>
            {pharmacy.stockStatus === "low_stock" ? t.lowStock : t.inStock}
          </span>
        </p>
      </div>
      <Button type="button" onClick={onOrder} className="shrink-0">
        {t.orderHere}
      </Button>
    </article>
  );
}
