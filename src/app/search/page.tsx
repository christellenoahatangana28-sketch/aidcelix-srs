"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { searchMedications, peekSearch, type SearchHit } from "@/lib/catalog-query";
import { useLocation } from "@/components/location/location-provider";
import { MedicationCard } from "@/components/medication/medication-card";
import { useI18n } from "@/components/i18n";

function SearchBody() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const { coords } = useLocation();
  const { t, tx } = useI18n();
  const [hits, setHits] = useState<SearchHit[]>(() => peekSearch(q, coords) ?? []);
  const [ready, setReady] = useState(() => Boolean(peekSearch(q, coords)));

  useEffect(() => {
    const last = { q, coords };
    sessionStorage.setItem("aidcelix.lastSearch", JSON.stringify(last));
    const cached = peekSearch(q, coords);
    if (cached) {
      setHits(cached);
      setReady(true);
    }
    searchMedications(q, coords)
      .then((rows) => {
        setHits(rows);
        setReady(true);
      })
      .catch(() => {
        setHits(cached ?? []);
        setReady(true);
      });
  }, [q, coords]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-3xl font-bold text-white">
        {q ? tx("resultsFor", { q }) : t.allMedications}
      </h1>
      <p className="mt-2 text-sm text-gray-400">
        {t.searchHint}
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {hits.map((hit) => (
          <MedicationCard key={hit.id} hit={hit} />
        ))}
      </div>
      {ready && hits.length === 0 ? <p className="mt-10 text-gray-400">{t.noMatchingMedication}</p> : null}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchBody />
    </Suspense>
  );
}

function SearchFallback() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-3xl font-bold text-white">{t.search}</h1>
    </div>
  );
}
