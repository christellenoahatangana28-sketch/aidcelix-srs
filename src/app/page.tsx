"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Camera, Clock, HeartPulse, MapPin, Search, ShieldCheck } from "lucide-react";
import { listCategories, nearbyPharmacies, peekCategories, peekNearby, peekSearch, searchMedications, type SearchHit } from "@/lib/catalog-query";
import type { Pharmacy } from "@/data/catalog";
import { useLocation } from "@/components/location/location-provider";
import { MedicationCard } from "@/components/medication/medication-card";
import { Button } from "@/components/ui/button";
import { HeroSlideshow } from "@/components/hero-slideshow";
import { formatDistance } from "@/lib/geo";
import { useI18n } from "@/components/i18n";

export default function HomePage() {
  const router = useRouter();
  const { coords, label } = useLocation();
  const { t, tx, category } = useI18n();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>(() => (peekSearch("", null) ?? []).slice(0, 8));
  const [categories, setCategories] = useState<string[]>(() => peekCategories());
  const [pharmacies, setPharmacies] = useState<(Pharmacy & { distanceKm: number })[]>(() => (peekNearby(null) ?? []).slice(0, 4));

  useEffect(() => {
    searchMedications("", coords)
      .then((rows) => setHits(rows.slice(0, 8)))
      .catch(() => setHits([]));
    nearbyPharmacies(coords)
      .then((rows) => setPharmacies(rows.slice(0, 4)))
      .catch(() => setPharmacies([]));
    listCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [coords]);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div>
      <section className="relative min-h-[88vh] overflow-hidden pb-24 pt-16">
        <HeroSlideshow />
        <div className="relative z-10 mx-auto max-w-7xl px-6 text-center [text-shadow:0_2px_16px_rgba(0,0,0,0.85)]">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/15 px-4 py-2 text-sm text-white backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {tx("liveStockNear", { label })}
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white md:text-7xl">
            {t.heroTitle1}
            <br />
            {t.heroTitle2}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white">
            {t.heroSubtitle}
          </p>
          <form onSubmit={onSearch} className="mx-auto mt-10 flex max-w-2xl gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.searchExamples}
                className="w-full rounded-xl border border-white/50 bg-white/20 py-4 pl-12 pr-4 text-white outline-none placeholder:text-white/80 backdrop-blur-sm focus:border-white"
              />
            </div>
            <Button type="submit" variant="inverse" className="px-6 py-4 text-base">
              {t.search}
            </Button>
          </form>
          <div className="mt-4 flex justify-center">
            <Link
              href="/scan"
              prefetch
              data-press
              className="inline-flex items-center gap-2 rounded-xl border border-white/50 bg-white/15 px-5 py-3 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/25"
            >
              <Camera className="h-4 w-4" />
              {t.scanPrescription}
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {categories.map((categoryName) => (
              <Link
                key={categoryName}
                href={`/search?q=${encodeURIComponent(categoryName)}`}
                prefetch
                data-press
                className="rounded-full border border-white/50 bg-white/15 px-4 py-1.5 text-sm text-white backdrop-blur-sm hover:bg-white/25"
              >
                {category(categoryName)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black/50 py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 md:grid-cols-3">
          {[
            { icon: Search, title: t.featureSearchTitle, text: t.featureSearchText },
            { icon: MapPin, title: t.featureNearbyTitle, text: t.featureNearbyText },
            { icon: Clock, title: t.featurePayTitle, text: t.featurePayText },
          ].map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-white/5 bg-white/5 p-8">
              <feature.icon className="mb-4 h-8 w-8 text-white" />
              <h2 className="text-xl font-bold text-white">{feature.title}</h2>
              <p className="mt-2 text-white/80">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{t.medicationsNearYou}</h2>
            <p className="text-sm text-white/80">{t.medicationsNearYouHint}</p>
          </div>
          <Link href="/search" prefetch data-press className="text-sm text-white">
            {t.seeAll}
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {hits.map((hit) => (
            <MedicationCard key={hit.id} hit={hit} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <h2 className="mb-6 text-2xl font-bold text-white">{t.nearbyPharmacies}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {pharmacies.map((pharmacy) => (
            <Link
              key={pharmacy.id}
              href={`/pharmacies/${pharmacy.id}`}
              prefetch
              data-press
              className="rounded-2xl border border-white/5 bg-white/5 p-5 hover:border-emerald-500/30"
            >
              <h3 className="font-semibold text-white">{pharmacy.name}</h3>
              <p className="mt-1 text-sm text-white/80">
                {pharmacy.address} · {formatDistance(pharmacy.distanceKm)}
              </p>
              <p className="mt-2 text-xs text-white/60">
                {pharmacy.hours} · {tx("rating", { rating: pharmacy.rating })}
              </p>
            </Link>
          ))}
        </div>
        <div className="mt-10 flex items-center justify-center gap-2 text-sm text-white">
          <ShieldCheck className="h-4 w-4 text-white" />
          <HeartPulse className="h-4 w-4 text-white" />
          {t.securePayment}
        </div>
      </section>
    </div>
  );
}
