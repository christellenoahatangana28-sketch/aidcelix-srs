"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readOrders, type StoredOrder } from "@/lib/orders";
import { formatMoney } from "@/lib/format";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";

export default function OrdersPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<StoredOrder[]>([]);

  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/orders");
    setOrders(readOrders());
  }, [ready, user, router]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold text-white">Your commands</h1>
      <div className="mt-6 space-y-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="block rounded-2xl border border-white/5 bg-white/5 p-4 hover:border-emerald-500/30"
          >
            <div className="flex justify-between">
              <p className="font-semibold text-white">{order.pharmacyName}</p>
              <p className="text-emerald-400">{formatMoney(order.grandTotal, order.currency)}</p>
            </div>
            <p className="mt-1 text-sm text-gray-400">
              {new Date(order.createdAt).toLocaleString()} · {order.status.replaceAll("_", " ")}
            </p>
          </Link>
        ))}
        {orders.length === 0 ? <p className="text-gray-400">No orders yet.</p> : null}
      </div>
    </div>
  );
}
