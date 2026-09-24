"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Search, ShoppingBag, User, UserPlus, LayoutDashboard } from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { LocationChip } from "@/components/location/location-chip";
import { useCart } from "@/components/cart/cart-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { useI18n } from "@/components/i18n";
import { Button } from "@/components/ui/button";
import { useState, type FormEvent } from "react";

export function Navbar() {
  const { count } = useCart();
  const { user } = useAuth();
  const { t, locale, toggle } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  const iconLink =
    "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-gray-300 hover:bg-white/5 hover:text-white sm:h-9 sm:w-9";

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-3 py-2 md:flex-row md:items-center md:gap-4 md:px-6 md:py-3">
        <div className="flex w-full min-w-0 items-center gap-1.5 sm:gap-2">
          <BrandLogo className="min-w-0 shrink" />
          <div className="hidden md:block">
            <LocationChip />
          </div>
          <form onSubmit={onSearch} className="hidden min-w-0 flex-1 md:block">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-gray-500 focus:border-emerald-500"
              />
            </label>
          </form>
          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
            <Button
              type="button"
              variant="secondary"
              size="compact"
              onClick={toggle}
              className="h-8 shrink-0 px-2 text-[11px] font-semibold sm:h-9 sm:px-3 sm:text-xs"
              aria-label={locale === "en" ? t.switchToFrench : t.switchToEnglish}
            >
              <span className="sm:hidden">{locale === "en" ? "FR" : "EN"}</span>
              <span className="hidden sm:inline">{locale === "en" ? "EN / FR" : "FR / EN"}</span>
            </Button>
            <Link href="/scan" prefetch data-press className={iconLink} aria-label={t.scanPrescription}>
              <Camera className="h-5 w-5" />
            </Link>
            <Link href="/cart" prefetch data-press className={`relative ${iconLink}`} aria-label={t.cart}>
              <ShoppingBag className="h-5 w-5" />
              {count > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-black">
                  {count}
                </span>
              ) : null}
            </Link>
            {user ? (
              <>
                <Link
                  href={user.role === "admin" ? "/admin" : "/dashboard"}
                  prefetch
                  data-press
                  className={iconLink}
                  aria-label={t.dashboard}
                >
                  <LayoutDashboard className="h-5 w-5" />
                </Link>
                <Link href="/profile" prefetch data-press className={iconLink} aria-label={t.profile}>
                  <User className="h-5 w-5" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  prefetch
                  data-press
                  className={`${iconLink} sm:w-auto sm:bg-white sm:px-3 sm:text-black sm:hover:bg-emerald-400`}
                  aria-label={t.signup}
                >
                  <UserPlus className="h-5 w-5 sm:hidden" />
                  <span className="hidden text-sm font-bold sm:inline">{t.signup}</span>
                </Link>
              </>
            )}
          </div>
        </div>
        <LocationChip className="md:hidden" />
        <form onSubmit={onSearch} className="md:hidden">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-emerald-500"
            />
          </label>
        </form>
      </div>
    </nav>
  );
}
