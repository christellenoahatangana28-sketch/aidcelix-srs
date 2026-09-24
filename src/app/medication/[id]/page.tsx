"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMedication, peekMedication, type SearchHit } from "@/lib/catalog-query";
import { formatMoney } from "@/lib/format";
import { useLocation } from "@/components/location/location-provider";
import { useCart } from "@/components/cart/cart-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { PharmacyRow } from "@/components/pharmacy/pharmacy-row";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/components/i18n";

export default function MedicationPage() {
  const { id } = useParams<{ id: string }>();
  const { coords } = useLocation();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { notify } = useToast();
  const { t, category } = useI18n();
  const router = useRouter();
  const [hit, setHit] = useState<SearchHit | null>(() => peekMedication(id));

  useEffect(() => {
    setHit(peekMedication(id));
    getMedication(id, coords).then(setHit);
  }, [id, coords]);

  if (!hit) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-bold text-white">{t.medication}</h1>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex flex-col gap-6 rounded-2xl border border-white/5 bg-white/5 p-6 md:flex-row">
        <div className="grid h-40 w-40 place-items-center rounded-xl bg-black/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hit.image} alt="" className="h-24 w-24" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-emerald-400">{category(hit.category)}</p>
          <h1 className="mt-1 text-3xl font-bold text-white">{hit.name}</h1>
          <p className="text-gray-400">
            {hit.genericName} · {hit.brand} · {hit.manufacturer}
          </p>
          <p className="mt-2 text-sm text-gray-400">{hit.dosage}</p>
          <p className="mt-4 text-3xl font-bold text-white">{formatMoney(hit.aidcelixPrice, hit.currency)}</p>
        </div>
      </div>

      <h2 className="mb-4 mt-10 text-xl font-bold text-white">{t.nearestWithStock}</h2>
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
              notify(t.addedToCart);
              router.push(user ? "/cart" : `/login?next=/cart`);
            }}
          />
        ))}
        {hit.pharmacies.length === 0 ? (
          <p className="text-gray-400">{t.noPartnerStock}</p>
        ) : null}
      </div>
    </div>
  );
}
