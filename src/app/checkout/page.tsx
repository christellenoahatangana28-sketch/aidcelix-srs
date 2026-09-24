"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { COUNTRY } from "@/lib/country";
import { formatMoney } from "@/lib/format";
import { getDeliveryProvider } from "@/lib/providers";
import { getPharmacy } from "@/lib/catalog-query";
import { placeOrder } from "@/lib/orders";
import { useAuth } from "@/components/auth/auth-provider";
import { useCart } from "@/components/cart/cart-provider";
import { useLocation } from "@/components/location/location-provider";
import type { Pharmacy } from "@/data/catalog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/components/i18n";

export default function CheckoutPage() {
  const { user, ready, updateProfile } = useAuth();
  const { items, clear } = useCart();
  const { coords, label } = useLocation();
  const router = useRouter();
  const { notify } = useToast();
  const { t, tx, errorMessage } = useI18n();
  const [address, setAddress] = useState(user?.address ?? "");
  const [pharmacy, setPharmacy] = useState<(Pharmacy & { distanceKm: number }) | null>(null);
  const [fee, setFee] = useState<number | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const medTotal = items.reduce((sum, item) => sum + item.aidcelixPrice * item.quantity, 0);

  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/checkout");
  }, [ready, user, router]);

  useEffect(() => {
    if (user?.address) setAddress(user.address);
  }, [user]);

  useEffect(() => {
    const slug = items[0]?.pharmacyId;
    if (!slug) return;
    getPharmacy(slug, coords).then(setPharmacy);
  }, [items, coords]);

  useEffect(() => {
    async function quote() {
      if (!pharmacy || !coords) return;
      const result = await getDeliveryProvider().quote(
        { lat: pharmacy.lat, lng: pharmacy.lng },
        coords,
        { weightKg: items.reduce((sum, item) => sum + item.quantity * 0.08, 0), itemCount: items.length },
      );
      setFee(result.fee);
      setEta(result.etaMinutes);
    }
    quote();
  }, [pharmacy, coords, items]);

  async function onPlaceOrder() {
    if (!user || !pharmacy || !coords || fee === null) return;
    const dropoff = address.trim();
    if (!dropoff) {
      setError(t.enterDeliveryAddress);
      return;
    }
    setError("");
    setBusy(true);
    try {
      const orderId = await placeOrder({
        pharmacySlug: pharmacy.id,
        items: items.map((item) => ({ slug: item.id, quantity: item.quantity })),
        dropoffLabel: dropoff,
        dropoffLat: coords.lat,
        dropoffLng: coords.lng,
        dropoffContact: user.phone,
      });
      await updateProfile({ address: dropoff });
      clear();
      notify(t.orderPlaced);
      router.push(`/pay/${orderId}`);
    } catch (err) {
      setError(errorMessage(err, "couldNotPlaceOrder"));
    } finally {
      setBusy(false);
    }
  }

  if (!items.length) {
    return <div className="px-6 py-16 text-gray-400">{t.cartEmpty}</div>;
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <h1 className="text-3xl font-bold text-white">{t.reviewCommand}</h1>
      <p className="mt-2 text-sm text-gray-400">{tx("pickup", { name: pharmacy?.name ?? "" })}</p>
      <label className="mt-6 block text-sm text-gray-400">
        {t.deliveryAddress}
        <input
          required
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder={label || t.addressPlaceholder}
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white"
        />
      </label>
      <ul className="mt-6 space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between text-gray-300">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span>{formatMoney(item.aidcelixPrice * item.quantity, COUNTRY.currency)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 space-y-2 border-t border-white/10 pt-4 text-sm">
        <p className="flex justify-between text-gray-300">
          <span>{t.medicationsAidcelix}</span>
          <span>{formatMoney(medTotal, COUNTRY.currency)}</span>
        </p>
        <p className="flex justify-between text-gray-300">
          <span>{eta ? tx("deliveryEta", { eta }) : t.deliveryNoEta}</span>
          <span>{fee === null ? "…" : formatMoney(fee, COUNTRY.currency)}</span>
        </p>
        <p className="flex justify-between text-lg font-bold text-white">
          <span>{t.total}</span>
          <span>{fee === null ? "…" : formatMoney(medTotal + fee, COUNTRY.currency)}</span>
        </p>
      </div>
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      <Button type="button" size="lg" className="mt-6" disabled={fee === null || !address.trim()} busy={busy} onClick={onPlaceOrder}>
        {busy ? t.placingOrder : t.confirmAndPay}
      </Button>
    </div>
  );
}
