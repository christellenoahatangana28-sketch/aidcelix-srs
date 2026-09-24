"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listOrders, type StoredOrder } from "@/lib/orders";
import { formatMoney, formatPickupCode } from "@/lib/format";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n";

export default function OrdersPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const { t, orderStatus, formatDate, errorMessage } = useI18n();
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/orders");
    if (!user) return;
    listOrders(user.id)
      .then(setOrders)
      .catch((err) => setError(errorMessage(err, "couldNotLoadOrders")));
  }, [ready, user, router]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold text-white">{t.yourCommands}</h1>
      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
      <div className="mt-6 space-y-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            prefetch
            data-press
            className="block rounded-2xl border border-white/5 bg-white/5 p-4 hover:border-emerald-500/30"
          >
            <div className="flex justify-between gap-4">
              <p className="font-semibold text-white">{order.pharmacyName}</p>
              <p className="font-mono text-sm font-bold tracking-[0.2em] text-white">{formatPickupCode(order.pickupCode)}</p>
            </div>
            <p className="mt-1 text-sm text-emerald-300">{formatMoney(order.grandTotal, order.currency)}</p>
            <p className="mt-1 text-sm text-gray-400">
              {formatDate(order.createdAt)} · {orderStatus(order.status)}
            </p>
          </Link>
        ))}
        {orders.length === 0 ? <p className="text-gray-400">{t.noOrdersYet}</p> : null}
      </div>
    </div>
  );
}
