"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { dashboardHome } from "@/lib/dashboard";

export default function DashboardIndexPage() {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready || !user) return;
    router.replace(dashboardHome(user.role));
  }, [ready, user, router]);

  return null;
}
