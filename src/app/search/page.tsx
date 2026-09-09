"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { searchMedications, type SearchHit } from "@/lib/catalog-query";
import { useLocation } from "@/components/location/location-provider";
import { MedicationCard } from "@/components/medication/medication-card";

function SearchBody() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const { coords } = useLocation();
  const [hits, setHits] = useState<SearchHit[]>([]);

  useEffect(() => {
    const last = { q, coords };
    sessionStorage.setItem("aidcelix.lastSearch", JSON.stringify(last));
    searchMedications(q, coords).then(setHits);
  }, [q, coords]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-3xl font-bold text-white">
        {q ? `Results for “${q}”` : "All medications"}
      </h1>
      <p className="mt-2 text-sm text-gray-400">
        Pharmacies are sorted by distance from your current location. Only in-stock and low-stock locations are listed on each card.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {hits.map((hit) => (
          <MedicationCard key={hit.id} hit={hit} />
        ))}
      </div>
      {hits.length === 0 ? <p className="mt-10 text-gray-400">No matching medication.</p> : null}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="px-6 py-10 text-gray-400">Searching…</div>}>
      <SearchBody />
    </Suspense>
  );
}
