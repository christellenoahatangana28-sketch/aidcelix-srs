"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fill,
  lookup,
  messages,
  translateCategory,
  translateDeliveryStatus,
  translateOrderStatus,
  translateRole,
  type Locale,
  type MessageKey,
} from "@/lib/i18n/messages";

export type { Locale, MessageKey };

const STORAGE_KEY = "aidcelix.locale";
const COOKIE = "aidcelix.locale";

type I18nState = {
  locale: Locale;
  t: Record<MessageKey, string>;
  tx: (key: MessageKey, vars?: Record<string, string | number>) => string;
  toggle: () => void;
  category: (name: string) => string;
  roleLabel: (role: string) => string;
  orderStatus: (status: string) => string;
  deliveryStatus: (status: string) => string;
  formatDate: (value: string | number | Date) => string;
  errorMessage: (err: unknown, fallback: MessageKey) => string;
};

const I18nContext = createContext<I18nState | null>(null);

function persist(locale: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
  document.cookie = `${COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  document.documentElement.lang = locale;
}

export function I18nProvider({
  children,
  initialLocale = "en",
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "fr") {
        setLocale(stored);
        persist(stored);
        return;
      }
    } catch {
      /* ignore */
    }
    persist(locale);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const toggle = useCallback(() => {
    setLocale((current) => {
      const next: Locale = current === "en" ? "fr" : "en";
      persist(next);
      return next;
    });
  }, []);

  const tx = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => lookup(locale, key, vars),
    [locale],
  );

  const errorMessage = useCallback(
    (err: unknown, fallback: MessageKey) => {
      const raw = err instanceof Error ? err.message : "";
      const known: Record<string, MessageKey> = {
        "Login failed": "loginFailed",
        "Could not register": "couldNotRegister",
        "Could not place order": "couldNotPlaceOrder",
        "Could not save profile": "couldNotSaveProfile",
        "Could not load orders": "couldNotLoadOrders",
        "Could not save pharmacy": "couldNotSavePharmacy",
        "Could not load pharmacy": "couldNotLoadPharmacy",
        "Could not load stock": "couldNotLoadStock",
        "Could not add medication": "couldNotAddMedication",
        "Enter a price greater than zero": "priceMustBePositive",
        "Could not save stock": "couldNotSaveStock",
        "Save your pharmacy details first": "savePharmacyFirstCatalog",
        "Only pharmacy accounts can manage stock": "pharmacyRestricted",
        "Medication not found": "noMatchingMedication",
        "Could not load admin data": "couldNotLoadAdmin",
        "Could not claim admin": "couldNotClaimAdmin",
        "Could not update role": "couldNotUpdateRole",
        "Could not send reset email": "couldNotSendReset",
        "Could not update password": "couldNotUpdatePassword",
        "Payment error": "paymentError",
        "Check your email to confirm the account, then log in.": "confirmEmail",
        "Log in with the email you registered.": "loginWithEmail",
        "Staff accounts only. Use the store login.": "staffOnly",
        "Staff must sign in at the admin portal.": "useStaffPortal",
      };
      const key = known[raw];
      return key ? messages[locale][key] : raw || messages[locale][fallback];
    },
    [locale],
  );

  const value = useMemo<I18nState>(
    () => ({
      locale,
      t: messages[locale] as Record<MessageKey, string>,
      tx,
      toggle,
      category: (name) => translateCategory(locale, name),
      roleLabel: (role) => translateRole(locale, role),
      orderStatus: (status) => translateOrderStatus(locale, status),
      deliveryStatus: (status) => translateDeliveryStatus(locale, status),
      formatDate: (date) =>
        new Date(date).toLocaleString(locale === "fr" ? "fr-CM" : "en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      errorMessage,
    }),
    [locale, tx, toggle, errorMessage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export { fill };
