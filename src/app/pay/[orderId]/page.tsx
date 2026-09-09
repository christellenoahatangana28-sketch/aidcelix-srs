"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { COUNTRY } from "@/data/catalog";
import { formatMoney } from "@/lib/format";
import { getOrder, saveOrder } from "@/lib/orders";
import { getDeliveryProvider, getPaymentProvider } from "@/lib/providers";
import { methodLabel } from "@/lib/providers/payment-mock";
import type { PaymentMethod } from "@/lib/providers/types";
import { useAuth } from "@/components/auth/auth-provider";
import type { StoredOrder } from "@/lib/orders";

export default function PayPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user, ready } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("mtn");
  const [msisdn, setMsisdn] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=/pay/${orderId}`);
    setOrder(getOrder(orderId));
    if (user?.phone) setMsisdn(user.phone);
  }, [ready, user, router, orderId]);

  if (!order) return <div className="px-6 py-16 text-gray-400">Order not found.</div>;

  async function pay(succeed = true) {
    if (!order) return;
    const current = order;
    setBusy(true);
    setError("");
    try {
      const provider = getPaymentProvider();
      const session = await provider.initiate(
        current.id,
        current.grandTotal,
        current.currency,
        method,
        msisdn,
      );
      const result = await provider.confirm(session.sessionId, succeed);
      if (result.status !== "succeeded") {
        saveOrder({ ...current, status: "failed_payment" });
        setError("Payment failed. Try again or pick another method.");
        return;
      }
      const delivery = await getDeliveryProvider().createDelivery({
        orderId: current.id,
        pickup: current.pickup,
        dropoff: current.dropoff,
        package: { weightKg: 0.4, itemCount: current.items.length },
        items: current.items.map((item) => ({ name: item.name, quantity: item.quantity })),
      });
      saveOrder({
        ...current,
        status: "notified_gozem",
        paymentMethod: method,
        paymentRef: result.providerRef,
        gozemRef: delivery.providerRef,
        deliveryStatus: delivery.status,
      });
      router.push(`/orders/${current.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-3xl font-bold text-white">Pay in-app</h1>
      <p className="mt-2 text-gray-400">
        Amount due {formatMoney(order.grandTotal, order.currency || COUNTRY.currency)}
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {(["mtn", "orange"] as PaymentMethod[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setMethod(option)}
            className={`rounded-xl border px-4 py-3 font-semibold ${
              method === option
                ? "border-emerald-400 bg-emerald-500/20 text-white"
                : "border-white/10 bg-white/5 text-gray-300"
            }`}
          >
            {methodLabel(option)}
          </button>
        ))}
      </div>
      <label className="mt-4 block text-sm text-gray-400">
        Payer mobile number
        <input
          value={msisdn}
          onChange={(event) => setMsisdn(event.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white"
        />
      </label>
      <p className="mt-3 text-xs text-gray-500">
        You will receive a {methodLabel(method)} prompt. AIDCELIX never stores your PIN.
      </p>
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => pay(true)}
        className="mt-6 w-full rounded-xl bg-emerald-500 py-3 font-bold text-black"
      >
        {busy ? "Processing…" : `Pay with ${methodLabel(method)}`}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => pay(false)}
        className="mt-3 w-full rounded-xl border border-white/10 py-2 text-sm text-gray-400"
      >
        Simulate failed payment
      </button>
    </div>
  );
}
