"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { formatDistance } from "@/lib/geo";
import type { SearchHit } from "@/lib/catalog-query";
import { useI18n } from "@/components/i18n";

export function MedicationCard({ hit }: { hit: SearchHit }) {
  const { t } = useI18n();
  const nearest = hit.pharmacies[0];

  return (
    <Link
      href={`/medication/${hit.id}`}
      className="group flex flex-col rounded-2xl border border-white/5 bg-white/5 p-4 transition hover:border-emerald-500/30 hover:bg-white/[0.07]"
    >
      <div className="mb-4 grid h-28 place-items-center rounded-xl bg-black/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={hit.image} alt="" className="h-16 w-16" />
      </div>
      <p className="text-xs uppercase tracking-wide text-emerald-400">{hit.category}</p>
      <h3 className="mt-1 font-semibold text-white group-hover:text-emerald-400">{hit.name}</h3>
      <p className="text-sm text-gray-400">{hit.dosage}</p>
      <p className="mt-3 text-lg font-bold text-white">{formatMoney(hit.aidcelixPrice, hit.currency)}</p>
      {nearest ? (
        <p className="mt-2 text-xs text-gray-400">
          {nearest.name} · {formatDistance(nearest.distanceKm)} ·{" "}
          {nearest.stockStatus === "low_stock" ? t.lowStock : t.inStock}
        </p>
      ) : (
        <p className="mt-2 text-xs text-amber-400">No nearby stock</p>
      )}
    </Link>
  );
}
