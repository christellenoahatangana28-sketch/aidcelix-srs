"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/cn";
import { useI18n } from "@/components/i18n";

const LINKS = [
  { href: "/dashboard/user", key: "userDashboard" as const, roles: ["customer", "pharmacy"] },
  { href: "/dashboard/pharmacy", key: "pharmacyDashboard" as const, roles: ["pharmacy"] },
] as const;

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t, tx, roleLabel } = useI18n();
  const role = user?.role ?? "customer";

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <p className="text-sm uppercase tracking-wide text-emerald-400">AIDCELIX</p>
      <h1 className="mt-1 text-3xl font-bold text-white">{t.dashboard}</h1>
      <p className="mt-2 text-sm text-gray-400">
        {tx("signedInAs", { name: user?.fullName || user?.email || "", role: roleLabel(role) })}
      </p>
      <nav className="mt-6 flex flex-wrap gap-2">
        {LINKS.filter((link) => (link.roles as readonly string[]).includes(role)).map((link) => (
          <Link
            key={link.href}
            href={link.href}
            prefetch
            data-press
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold",
              pathname === link.href
                ? "bg-emerald-500 text-black"
                : "border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white",
            )}
          >
            {t[link.key]}
          </Link>
        ))}
      </nav>
      <div className="mt-8">{children}</div>
    </div>
  );
}
