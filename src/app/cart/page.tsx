"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { formatMoney } from "@/lib/format";
import { COUNTRY } from "@/lib/country";
import { Button, buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/components/i18n";

export default function CartPage() {
  const { items, setQuantity, remove, count } = useCart();
  const { user } = useAuth();
  const { notify } = useToast();
  const { t, tx } = useI18n();
  const medTotal = items.reduce((sum, item) => sum + item.aidcelixPrice * item.quantity, 0);
  const checkoutHref = user ? "/checkout" : "/login?next=/checkout";

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold text-white">{t.cart}</h1>
      {count === 0 ? (
        <p className="mt-6 text-gray-400">
          {t.emptyCart}{" "}
          <Link href="/search" prefetch className="text-emerald-400">
            {t.searchAMedication}
          </Link>
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-gray-400">{tx("pharmacyLabel", { name: items[0]?.pharmacyName ?? "" })}</p>
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
                <Button
                  type="button"
                  variant="ghost"
                  size="compact"
                  onClick={() => {
                    remove(item.id);
                    notify(t.removedFromCart);
                  }}
                >
                  {t.remove}
                </Button>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-4 text-lg font-bold text-white">
            <span>{t.medications}</span>
            <span>{formatMoney(medTotal, COUNTRY.currency)}</span>
          </div>
          <Link href={checkoutHref} prefetch data-press className={cn(buttonStyles({ variant: "primary", size: "lg" }))}>
            {t.continueToCheckout}
          </Link>
        </div>
      )}
    </div>
  );
}
