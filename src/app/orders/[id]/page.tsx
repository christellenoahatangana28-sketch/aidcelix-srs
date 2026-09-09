"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getOrder, saveOrder, type StoredOrder } from "@/lib/orders";
import { formatMoney } from "@/lib/format";
import { nextDeliveryStatus } from "@/lib/providers/gozem-mock";
import { useAuth } from "@/components/auth/auth-provider";

const LABELS: Record<string, string> = {
  order_received: "Order received",
  driver_assigned: "Driver assigned",
  pickup_in_progress: "Pickup in progress",
  en_route: "En route",
  delivered: "Delivered",
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, ready } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<StoredOrder | null>(null);

  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=/orders/${id}`);
    setOrder(getOrder(id));
  }, [id, ready, user, router]);

  if (!order) return <div className="px-6 py-16 text-gray-400">Order not found.</div>;

  const currentOrder = order;

  function simulate() {
    const status = currentOrder.deliveryStatus;
    if (!status) return;
    const next = nextDeliveryStatus(status);
    const updated: StoredOrder = {
      ...currentOrder,
      deliveryStatus: next,
      status: next === "delivered" ? "delivered" : next === "en_route" ? "out_for_delivery" : "preparing",
    };
    saveOrder(updated);
    setOrder(updated);
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <h1 className="text-3xl font-bold text-white">Tracking</h1>
      <p className="mt-2 text-gray-400">
        {order.pharmacyName} → {order.dropoff.label}
      </p>
      <p className="mt-4 text-sm text-emerald-400">
        {order.deliveryStatus ? LABELS[order.deliveryStatus] : order.status.replaceAll("_", " ")}
      </p>
      <ol className="mt-6 space-y-2 text-sm text-gray-400">
        {Object.entries(LABELS).map(([key, label]) => (
          <li key={key} className={order.deliveryStatus === key ? "text-emerald-400" : ""}>
            {label}
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
          <span>Gozem</span>
          <span>{formatMoney(order.deliveryFee, order.currency)}</span>
        </p>
        <p className="mt-2 flex justify-between font-bold text-white">
          <span>Total paid</span>
          <span>{formatMoney(order.grandTotal, order.currency)}</span>
        </p>
        {order.paymentRef ? <p className="mt-2 text-xs text-gray-500">Receipt {order.paymentRef}</p> : null}
      </div>
      {order.deliveryStatus && order.deliveryStatus !== "delivered" ? (
        <button
          type="button"
          onClick={simulate}
          className="mt-6 w-full rounded-xl border border-white/10 py-2 text-sm text-gray-300"
        >
          Simulate next Gozem status
        </button>
      ) : null}
    </div>
  );
}
