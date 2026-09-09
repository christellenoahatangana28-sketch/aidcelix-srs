"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Clock, HeartPulse, MapPin, Search, ShieldCheck } from "lucide-react";
import { CATEGORIES } from "@/data/catalog";
import { nearbyPharmacies, searchMedications, type SearchHit } from "@/lib/catalog-query";
import { useLocation } from "@/components/location/location-provider";
import { MedicationCard } from "@/components/medication/medication-card";
import { HeroSlideshow } from "@/components/hero-slideshow";
import { formatDistance } from "@/lib/geo";

export default function HomePage() {
  const router = useRouter();
  const { coords, label } = useLocation();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const pharmacies = nearbyPharmacies(coords).slice(0, 4);

  useEffect(() => {
    searchMedications("", coords).then((rows) => setHits(rows.slice(0, 8)));
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
            Live stock near {label}
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white md:text-7xl">
            Find medicines
            <br />
            instantly & locally
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white">
            Search a medication. AIDCELIX shows the nearest pharmacies that have it in stock, with delivery by Gozem.
          </p>
          <form onSubmit={onSearch} className="mx-auto mt-10 flex max-w-2xl gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Paracetamol, Coartem, Amoxicillin…"
                className="w-full rounded-xl border border-white/50 bg-white/20 py-4 pl-12 pr-4 text-white outline-none placeholder:text-white/80 backdrop-blur-sm focus:border-white"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-white px-6 py-4 font-bold text-black hover:bg-emerald-100"
            >
              Search
            </button>
          </form>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((category) => (
              <Link
                key={category}
                href={`/search?q=${encodeURIComponent(category)}`}
                className="rounded-full border border-white/50 bg-white/15 px-4 py-1.5 text-sm text-white backdrop-blur-sm hover:bg-white/25"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black/50 py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 md:grid-cols-3">
          {[
            { icon: Search, title: "Smart search", text: "Find a medicine by name, generic, brand, or category." },
            { icon: MapPin, title: "Nearest stock", text: "GPS starts on open. Results list pharmacies closest to you first." },
            { icon: Clock, title: "Pay & deliver", text: "Orange Money or MTN Money, then Gozem brings it to your door." },
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
            <h2 className="text-2xl font-bold text-white">Medications near you</h2>
            <p className="text-sm text-white/80">AIDCELIX prices. Nearest in-stock pharmacy shown on each card.</p>
          </div>
          <Link href="/search" className="text-sm text-white">
            See all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {hits.map((hit) => (
            <MedicationCard key={hit.id} hit={hit} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <h2 className="mb-6 text-2xl font-bold text-white">Nearby pharmacies</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {pharmacies.map((pharmacy) => (
            <Link
              key={pharmacy.id}
              href={`/pharmacies/${pharmacy.id}`}
              className="rounded-2xl border border-white/5 bg-white/5 p-5 hover:border-emerald-500/30"
            >
              <h3 className="font-semibold text-white">{pharmacy.name}</h3>
              <p className="mt-1 text-sm text-white/80">
                {pharmacy.address} · {formatDistance(pharmacy.distanceKm)}
              </p>
              <p className="mt-2 text-xs text-white/60">
                {pharmacy.hours} · rating {pharmacy.rating}
              </p>
            </Link>
          ))}
        </div>
        <div className="mt-10 flex items-center justify-center gap-2 text-sm text-white">
          <ShieldCheck className="h-4 w-4 text-white" />
          <HeartPulse className="h-4 w-4 text-white" />
          Secure in-app payment · Gozem delivery only
        </div>
      </section>
    </div>
  );
}
