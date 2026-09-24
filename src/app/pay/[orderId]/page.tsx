"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { COUNTRY } from "@/lib/country";
import { formatMoney } from "@/lib/format";
import { completePayment, getOrder } from "@/lib/orders";
import { getDeliveryProvider, getPaymentProvider } from "@/lib/providers";
import { methodLabel } from "@/lib/providers/payment-mock";
import type { PaymentMethod } from "@/lib/providers/types";
import { useAuth } from "@/components/auth/auth-provider";
import type { StoredOrder } from "@/lib/orders";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/components/i18n";

export default function PayPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user, ready } = useAuth();
  const router = useRouter();
  const { notify } = useToast();
  const { t, tx, errorMessage } = useI18n();
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("mtn");
  const [msisdn, setMsisdn] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=/pay/${orderId}`);
    if (!user) return;
    getOrder(orderId).then(setOrder);
    if (user.phone) setMsisdn(user.phone);
  }, [ready, user, router, orderId]);

  if (!order) {
    return (
      <div className="mx-auto max-w-md px-6 py-10">
        <h1 className="text-3xl font-bold text-white">{t.payInApp}</h1>
      </div>
    );
  }

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
      const delivery = succeed
        ? await getDeliveryProvider().createDelivery({
            orderId: current.id,
            pickup: current.pickup,
            dropoff: current.dropoff,
            package: { weightKg: 0.4, itemCount: current.items.length },
            items: current.items.map((item) => ({ name: item.name, quantity: item.quantity })),
          })
        : { providerRef: "", status: "order_received" as const };
      await completePayment({
        orderId: current.id,
        method,
        succeeded: result.status === "succeeded",
        paymentRef: result.providerRef ?? "",
        gozemRef: delivery.providerRef,
      });
      if (result.status !== "succeeded") {
        setError(t.paymentFailed);
        notify(t.paymentFailed);
        const refreshed = await getOrder(current.id);
        if (refreshed) setOrder(refreshed);
        return;
      }
      notify(t.paymentReceived);
      router.push(`/orders/${current.id}`);
    } catch (err) {
      setError(errorMessage(err, "paymentError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-3xl font-bold text-white">{t.payInApp}</h1>
      <p className="mt-2 text-gray-400">
        {tx("amountDue", { amount: formatMoney(order.grandTotal, order.currency || COUNTRY.currency) })}
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {(["mtn", "orange"] as PaymentMethod[]).map((option) => (
          <Button
            key={option}
            type="button"
            variant={method === option ? "primary" : "secondary"}
            onClick={() => setMethod(option)}
          >
            {methodLabel(option)}
          </Button>
        ))}
      </div>
      <label className="mt-4 block text-sm text-gray-400">
        {t.payerMobile}
        <input
          value={msisdn}
          onChange={(event) => setMsisdn(event.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white"
        />
      </label>
      <p className="mt-3 text-xs text-gray-500">
        {tx("momoPrompt", { method: methodLabel(method) })}
      </p>
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      <Button type="button" size="lg" className="mt-6" busy={busy} onClick={() => pay(true)}>
        {busy ? t.processing : tx("payWith", { method: methodLabel(method) })}
      </Button>
      <Button type="button" variant="secondary" size="lg" className="mt-3 font-medium" disabled={busy} onClick={() => pay(false)}>
        {t.simulateFailedPayment}
      </Button>
    </div>
  );
}
