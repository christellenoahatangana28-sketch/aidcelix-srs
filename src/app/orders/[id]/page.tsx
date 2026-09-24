"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { advanceDelivery, getOrder, type StoredOrder } from "@/lib/orders";
import { formatMoney } from "@/lib/format";
import { PickupCode } from "@/components/orders/pickup-code";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n";

const DELIVERY_KEYS = [
  "order_received",
  "driver_assigned",
  "pickup_in_progress",
  "en_route",
  "delivered",
] as const;

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, ready } = useAuth();
  const router = useRouter();
  const { t, tx, deliveryStatus, orderStatus } = useI18n();
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=/orders/${id}`);
    if (!user) return;
    getOrder(id).then(setOrder);
  }, [id, ready, user, router]);

  if (!order) {
    return (
      <div className="mx-auto max-w-xl px-6 py-10">
        <h1 className="text-3xl font-bold text-white">{t.tracking}</h1>
      </div>
    );
  }

  async function simulate() {
    if (!order?.deliveryStatus || order.deliveryStatus === "delivered") return;
    setBusy(true);
    try {
      const next = await advanceDelivery(order.id);
      const refreshed = await getOrder(order.id);
      setOrder(refreshed ?? { ...order, deliveryStatus: next });
    } finally {
      setBusy(false);
    }
  }

  const pharmacyView = user?.role === "pharmacy";
  const person = [order.customerName || t.customer, order.dropoff.contact].filter(Boolean).join(" · ");
  const codeHint = pharmacyView
    ? tx("pickupCodePharmacy", { name: person, pharmacy: order.pharmacyName })
    : tx("pickupCodeCustomer", { pharmacy: order.pharmacyName, name: order.customerName || t.customer });

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <h1 className="text-3xl font-bold text-white">{t.tracking}</h1>
      <p className="mt-2 text-gray-400">
        {order.customerName ? `${order.customerName} · ` : ""}
        {order.pharmacyName} → {order.dropoff.label}
      </p>
      <div className="mt-6">
        <PickupCode code={order.pickupCode} label={t.pickupCode} hint={codeHint} />
      </div>
      <p className="mt-4 text-sm text-emerald-400">
        {order.deliveryStatus ? deliveryStatus(order.deliveryStatus) : orderStatus(order.status)}
      </p>
      <ol className="mt-6 space-y-2 text-sm text-gray-400">
        {DELIVERY_KEYS.map((key) => (
          <li key={key} className={order.deliveryStatus === key ? "text-emerald-400" : ""}>
            {deliveryStatus(key)}
          </li>
        ))}
      </ol>
      <div className="mt-8 rounded-2xl border border-white/5 bg-white/5 p-4 text-sm">
        {order.items.map((item) => (
          <p key={item.id} className="flex justify-between text-gray-300">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span>{formatMoney(item.aidcelixPrice * item.quantity, order.currency)}</span>
          </p>
        ))}
        <p className="mt-3 flex justify-between text-gray-300">
          <span>{t.gozem}</span>
          <span>{formatMoney(order.deliveryFee, order.currency)}</span>
        </p>
        <p className="mt-2 flex justify-between font-bold text-white">
          <span>{t.totalPaid}</span>
          <span>{formatMoney(order.grandTotal, order.currency)}</span>
        </p>
        {order.paymentRef ? <p className="mt-2 text-xs text-gray-500">{tx("receipt", { ref: order.paymentRef })}</p> : null}
      </div>
      {order.deliveryStatus && order.deliveryStatus !== "delivered" ? (
        <Button type="button" variant="secondary" size="lg" className="mt-6 font-medium" busy={busy} onClick={simulate}>
          {t.simulateNextGozem}
        </Button>
      ) : null}
    </div>
  );
}
