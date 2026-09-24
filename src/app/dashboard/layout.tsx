"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { DashboardShell } from "@/components/dashboard/shell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login?next=/dashboard");
      return;
    }
    if (user.role === "admin") router.replace("/admin");
  }, [ready, user, router]);

  if (!ready || !user || user.role === "admin") {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10" aria-hidden>
        <div className="h-9 w-44 animate-pulse rounded-lg bg-white/10" />
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
