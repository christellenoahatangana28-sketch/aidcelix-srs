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
import type { MedicationQuote } from "@/lib/providers/types";

export type CartItem = MedicationQuote & {
  quantity: number;
  pharmacyId: string;
  pharmacyName: string;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
};

const KEY = "aidcelix.cart";
const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((current) => {
      const samePharmacy = current.filter((row) => row.pharmacyId === item.pharmacyId);
      const othersCleared =
        current.length > 0 && current[0].pharmacyId !== item.pharmacyId ? [] : samePharmacy;
      const existing = othersCleared.find((row) => row.id === item.id);
      if (existing) {
        return othersCleared.map((row) =>
          row.id === item.id ? { ...row, quantity: row.quantity + quantity } : row,
        );
      }
      return [...othersCleared, { ...item, quantity }];
    });
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    setItems((current) =>
      current
        .map((row) => (row.id === id ? { ...row, quantity } : row))
        .filter((row) => row.quantity > 0),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setItems((current) => current.filter((row) => row.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      addItem,
      setQuantity,
      remove,
      clear,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    [items, addItem, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
