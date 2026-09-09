"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { pharmacies } from "@/data/catalog";
import { COUNTRY } from "@/data/catalog";
import { formatMoney } from "@/lib/format";
import { getDeliveryProvider } from "@/lib/providers";
import { platformFeeFromBase } from "@/lib/pricing";
import { getPricingProvider } from "@/lib/providers";
import { saveOrder, type StoredOrder } from "@/lib/orders";
import { useAuth } from "@/components/auth/auth-provider";
import { useCart } from "@/components/cart/cart-provider";
import { useLocation } from "@/components/location/location-provider";

export default function CheckoutPage() {
  const { user, ready } = useAuth();
  const { items, clear } = useCart();
  const { coords, label } = useLocation();
  const router = useRouter();
  const [address, setAddress] = useState(user?.address ?? "");
  const [fee, setFee] = useState<number | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [error, setError] = useState("");

  const pharmacy = pharmacies.find((item) => item.id === items[0]?.pharmacyId);
  const medTotal = items.reduce((sum, item) => sum + item.aidcelixPrice * item.quantity, 0);

  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/checkout");
  }, [ready, user, router]);

  useEffect(() => {
    if (user?.address) setAddress(user.address);
  }, [user]);

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

  async function placeOrder() {
    if (!user || !pharmacy || !coords || fee === null) return;
    setError("");
    const lines = [];
    for (const item of items) {
      const internal = await getPricingProvider().getInternalPrice(item.id);
      const qty = item.quantity;
      const pharmacyDue = (internal?.medindexBase ?? item.aidcelixPrice) * qty;
      const platformFee = internal
        ? platformFeeFromBase(internal.medindexBase, qty)
        : item.aidcelixPrice * qty * 0.02;
      lines.push({
        id: item.id,
        name: item.name,
        quantity: qty,
        aidcelixPrice: item.aidcelixPrice,
        platformFee,
        pharmacyDue,
      });
    }
    const order: StoredOrder = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: "pending_payment",
      pharmacyId: pharmacy.id,
      pharmacyName: pharmacy.name,
      pickup: { lat: pharmacy.lat, lng: pharmacy.lng, label: pharmacy.name },
      dropoff: {
        lat: coords.lat,
        lng: coords.lng,
        label: address || label,
        contact: user.phone,
      },
      items: lines,
      medTotal,
      platformFee: lines.reduce((sum, line) => sum + line.platformFee, 0),
      pharmacyDue: lines.reduce((sum, line) => sum + line.pharmacyDue, 0),
      deliveryFee: fee,
      grandTotal: medTotal + fee,
      currency: COUNTRY.currency,
    };
    saveOrder(order);
    clear();
    router.push(`/pay/${order.id}`);
  }

  if (!items.length) {
    return <div className="px-6 py-16 text-gray-400">Your cart is empty.</div>;
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <h1 className="text-3xl font-bold text-white">Review command</h1>
      <p className="mt-2 text-sm text-gray-400">Pickup: {pharmacy?.name}</p>
      <label className="mt-6 block text-sm text-gray-400">
        Delivery address
        <input
          value={address}
          onChange={(event) => setAddress(event.target.value)}
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
          <span>Medications (AIDCELIX)</span>
          <span>{formatMoney(medTotal, COUNTRY.currency)}</span>
        </p>
        <p className="flex justify-between text-gray-300">
          <span>Gozem delivery {eta ? `· ~${eta} min` : ""}</span>
          <span>{fee === null ? "…" : formatMoney(fee, COUNTRY.currency)}</span>
        </p>
        <p className="flex justify-between text-lg font-bold text-white">
          <span>Total</span>
          <span>{fee === null ? "…" : formatMoney(medTotal + fee, COUNTRY.currency)}</span>
        </p>
      </div>
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      <button
        type="button"
        disabled={fee === null}
        onClick={placeOrder}
        className="mt-6 w-full rounded-xl bg-emerald-500 py-3 font-bold text-black hover:bg-emerald-400 disabled:opacity-40"
      >
        Confirm and pay
      </button>
    </div>
  );
}
