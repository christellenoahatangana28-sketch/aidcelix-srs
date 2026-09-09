"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { formatMoney } from "@/lib/format";
import { COUNTRY } from "@/data/catalog";

export default function CartPage() {
  const { items, setQuantity, remove, count } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const medTotal = items.reduce((sum, item) => sum + item.aidcelixPrice * item.quantity, 0);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold text-white">Cart</h1>
      {count === 0 ? (
        <p className="mt-6 text-gray-400">
          Empty. <Link href="/search" className="text-emerald-400">Search a medication</Link>
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-gray-400">Pharmacy: {items[0]?.pharmacyName}</p>
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4">
              <div>
                <p className="font-semibold text-white">{item.name}</p>
                <p className="text-sm text-gray-400">{formatMoney(item.aidcelixPrice, item.currency)}</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(event) => setQuantity(item.id, Number(event.target.value))}
                  className="w-16 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-white"
                />
                <button type="button" onClick={() => remove(item.id)} className="text-sm text-gray-500 hover:text-white">
                  Remove
                </button>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-4 text-lg font-bold text-white">
            <span>Medications</span>
            <span>{formatMoney(medTotal, COUNTRY.currency)}</span>
          </div>
          <button
            type="button"
            onClick={() => router.push(user ? "/checkout" : "/login?next=/checkout")}
            className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-black hover:bg-emerald-400"
          >
            Continue to checkout
          </button>
        </div>
      )}
    </div>
  );
}
