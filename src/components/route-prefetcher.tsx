"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { searchMedications, nearbyPharmacies } from "@/lib/catalog-query";

const STATIC_ROUTES = [
  "/",
  "/search",
  "/scan",
  "/cart",
  "/login",
  "/register",
  "/dashboard",
  "/dashboard/user",
  "/dashboard/pharmacy",
  "/dashboard/admin",
  "/orders",
  "/checkout",
  "/forgot-password",
  "/reset-password",
];

async function warmRoute(href: string) {
  await fetch(href, { credentials: "same-origin" }).catch(() => undefined);
}

export function RoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function warm() {
      for (const href of STATIC_ROUTES) {
        if (cancelled) return;
        router.prefetch(href);
      }

      await Promise.all(STATIC_ROUTES.map(warmRoute));
      if (cancelled) return;

      const [hits] = await Promise.all([searchMedications("", null), nearbyPharmacies(null)]);
      if (cancelled) return;

      const extra = new Set<string>();
      hits.forEach((hit) => {
        extra.add(`/medication/${hit.id}`);
        hit.pharmacies.forEach((pharmacy) => extra.add(`/pharmacies/${pharmacy.id}`));
      });

      for (const href of extra) {
        if (cancelled) return;
        router.prefetch(href);
      }
      await Promise.all([...extra].map(warmRoute));
    }

    void warm();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
