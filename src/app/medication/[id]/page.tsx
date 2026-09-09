"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMedication, type SearchHit } from "@/lib/catalog-query";
import { formatMoney } from "@/lib/format";
import { useLocation } from "@/components/location/location-provider";
import { useCart } from "@/components/cart/cart-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { PharmacyRow } from "@/components/pharmacy/pharmacy-row";

export default function MedicationPage() {
  const { id } = useParams<{ id: string }>();
  const { coords } = useLocation();
  const { addItem } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [hit, setHit] = useState<SearchHit | null>(null);

  useEffect(() => {
    getMedication(id, coords).then(setHit);
  }, [id, coords]);

  if (!hit) return <div className="px-6 py-16 text-gray-400">Loading…</div>;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex flex-col gap-6 rounded-2xl border border-white/5 bg-white/5 p-6 md:flex-row">
        <div className="grid h-40 w-40 place-items-center rounded-xl bg-black/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hit.image} alt="" className="h-24 w-24" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-emerald-400">{hit.category}</p>
          <h1 className="mt-1 text-3xl font-bold text-white">{hit.name}</h1>
          <p className="text-gray-400">
            {hit.genericName} · {hit.brand} · {hit.manufacturer}
          </p>
          <p className="mt-2 text-sm text-gray-400">{hit.dosage}</p>
          <p className="mt-4 text-3xl font-bold text-white">{formatMoney(hit.aidcelixPrice, hit.currency)}</p>
        </div>
      </div>

      <h2 className="mb-4 mt-10 text-xl font-bold text-white">Nearest pharmacies with stock</h2>
      <div className="space-y-3">
        {hit.pharmacies.map((pharmacy) => (
          <PharmacyRow
            key={pharmacy.id}
            pharmacy={pharmacy}
            onOrder={() => {
              addItem({
                ...hit,
                pharmacyId: pharmacy.id,
                pharmacyName: pharmacy.name,
              });
              router.push(user ? "/cart" : `/login?next=/cart`);
            }}
          />
        ))}
        {hit.pharmacies.length === 0 ? (
          <p className="text-gray-400">No partner pharmacy nearby currently stocks this medication.</p>
        ) : null}
      </div>
    </div>
  );
}
