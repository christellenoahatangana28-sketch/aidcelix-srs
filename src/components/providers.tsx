"use client";

import { AuthProvider } from "@/components/auth/auth-provider";
import { CartProvider } from "@/components/cart/cart-provider";
import { I18nProvider } from "@/components/i18n";
import { LocationProvider } from "@/components/location/location-provider";
import { GuideAssistant } from "@/components/assistant/guide-assistant";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { RoutePrefetcher } from "@/components/route-prefetcher";
import { ToastProvider } from "@/components/ui/toast";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/messages";

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const staff = pathname.startsWith("/admin");

  return (
    <>
      <RoutePrefetcher />
      {staff ? null : <Navbar />}
      <main className={staff ? "flex-1" : "flex-1 pt-40 md:pt-24"}>{children}</main>
      {staff ? null : <Footer />}
      {staff ? null : <GuideAssistant />}
    </>
  );
}

export function AppProviders({ children, initialLocale }: { children: ReactNode; initialLocale?: Locale }) {
  return (
    <I18nProvider initialLocale={initialLocale}>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <LocationProvider>
              <Shell>{children}</Shell>
            </LocationProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </I18nProvider>
  );
}
