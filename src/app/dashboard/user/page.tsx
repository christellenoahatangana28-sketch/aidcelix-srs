"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { listOrders, type StoredOrder } from "@/lib/orders";
import { formatMoney, formatPickupCode } from "@/lib/format";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useI18n } from "@/components/i18n";

export default function UserDashboardPage() {
  const { user } = useAuth();
  const { t, orderStatus, formatDate, errorMessage } = useI18n();
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    listOrders(user.id)
      .then(setOrders)
      .catch((err) => setError(errorMessage(err, "couldNotLoadOrders")));
  }, [user]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-white">{t.userDashboard}</h2>
      <p className="mt-2 text-sm text-gray-400">{t.userDashHint}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/5 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-wide text-emerald-400">{t.account}</p>
          <p className="mt-2 font-semibold text-white">{user?.fullName}</p>
          <p className="text-sm text-gray-400">{user?.email}</p>
          <p className="text-sm text-gray-400">{user?.phone || t.noPhoneYet}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-wide text-emerald-400">{t.commands}</p>
          <p className="mt-2 text-3xl font-bold text-white">{orders.length}</p>
          <p className="text-sm text-gray-400">{t.checkoutAddressHint}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-wide text-emerald-400">{t.nextStep}</p>
          <Link href="/search" prefetch data-press className={cn("mt-3", buttonStyles({ size: "compact" }))}>
            {t.findAMedication}
          </Link>
        </div>
      </div>

      <h3 className="mt-10 text-lg font-semibold text-white">{t.recentCommands}</h3>
      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
      <div className="mt-4 space-y-3">
        {orders.slice(0, 5).map((order) => (
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
      <Link href="/orders" prefetch className="mt-4 inline-block text-sm text-emerald-400">
        {t.viewAllOrders}
      </Link>
    </div>
  );
}
