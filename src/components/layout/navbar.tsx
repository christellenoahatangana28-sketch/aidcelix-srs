"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingBag, User } from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { LocationChip } from "@/components/location/location-chip";
import { useCart } from "@/components/cart/cart-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { useI18n } from "@/components/i18n";
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

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-6">
        <BrandLogo />
        <LocationChip />
        <form onSubmit={onSearch} className="hidden flex-1 md:block">
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
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            className="rounded-lg border border-white/10 px-2 py-1 text-xs text-gray-400 hover:text-white"
          >
            {locale.toUpperCase()}
          </button>
          <Link href="/cart" className="relative rounded-lg p-2 text-gray-300 hover:bg-white/5 hover:text-white">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-black">
                {count}
              </span>
            ) : null}
          </Link>
          {user ? (
            <Link href="/profile" className="rounded-lg p-2 text-gray-300 hover:bg-white/5 hover:text-white">
              <User className="h-5 w-5" />
            </Link>
          ) : (
            <Link
              href="/register"
              className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-black hover:bg-emerald-400"
            >
              {t.signup}
            </Link>
          )}
        </div>
      </div>
      <form onSubmit={onSearch} className="px-4 pb-3 md:hidden">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none"
        />
      </form>
    </nav>
  );
}
