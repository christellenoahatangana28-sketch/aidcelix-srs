"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, logout } = useAuth();
  const { t } = useI18n();
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (isLogin || !ready) return;
    if (!user) {
      router.replace("/admin/login");
      return;
    }
    if (user.role !== "admin") router.replace("/admin/login");
  }, [isLogin, ready, user, router]);

  if (isLogin) return children;

  if (!ready || !user || user.role !== "admin") {
    return (
      <div className="grid min-h-screen place-items-center bg-zinc-950">
        <div className="h-9 w-44 animate-pulse rounded-lg bg-white/10" />
      </div>
    );
  }

  async function onLogout() {
    await logout();
    router.replace("/admin/login");
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-white/10 bg-black/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <BrandLogo />
            <p className="mt-1 text-xs uppercase tracking-wide text-emerald-400">{t.staffPortal}</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden text-sm text-gray-400 sm:block">{user.email}</p>
            <Button type="button" variant="secondary" size="compact" onClick={onLogout}>
              {t.logOut}
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
      <p className="px-6 pb-8 text-center text-xs text-gray-600">
        <Link href="/" className="hover:text-gray-400">
          AIDCELIX
        </Link>
      </p>
    </div>
  );
}
