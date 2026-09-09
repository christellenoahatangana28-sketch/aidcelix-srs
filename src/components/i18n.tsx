"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Locale = "en" | "fr";

const copy = {
  en: {
    searchPlaceholder: "Search a medication…",
    nearby: "Nearby pharmacies",
    orderHere: "Order here",
    inStock: "In stock",
    lowStock: "Low stock",
    cart: "Cart",
    checkout: "Checkout",
    login: "Login",
    signup: "Sign up",
    delivery: "Gozem delivery",
    pay: "Pay",
  },
  fr: {
    searchPlaceholder: "Rechercher un médicament…",
    nearby: "Pharmacies proches",
    orderHere: "Commander ici",
    inStock: "En stock",
    lowStock: "Stock faible",
    cart: "Panier",
    checkout: "Payer",
    login: "Connexion",
    signup: "Créer un compte",
    delivery: "Livraison Gozem",
    pay: "Payer",
  },
} as const;

type MessageKey = keyof typeof copy.en;

type I18nState = {
  locale: Locale;
  t: Record<MessageKey, string>;
  toggle: () => void;
};

const I18nContext = createContext<I18nState | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const toggle = useCallback(() => setLocale((current) => (current === "en" ? "fr" : "en")), []);
  const value = useMemo(
    () => ({ locale, t: copy[locale] as Record<MessageKey, string>, toggle }),
    [locale, toggle],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
