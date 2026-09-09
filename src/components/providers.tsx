"use client";

import { AuthProvider } from "@/components/auth/auth-provider";
import { CartProvider } from "@/components/cart/cart-provider";
import { I18nProvider } from "@/components/i18n";
import { LocationProvider } from "@/components/location/location-provider";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>
        <CartProvider>
          <LocationProvider>
            <Navbar />
            <main className="flex-1 pt-24">{children}</main>
            <Footer />
          </LocationProvider>
        </CartProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
