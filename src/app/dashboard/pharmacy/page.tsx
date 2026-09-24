"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useLocation } from "@/components/location/location-provider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  getMyPharmacy,
  listMyInventory,
  saveMyPharmacy,
  setMyStockItem,
  type InventoryRow,
  type ManagedPharmacy,
  type StockStatus,
} from "@/lib/dashboard";
import { listPharmacyOrders, type StoredOrder } from "@/lib/orders";
import { formatMoney, formatPickupCode } from "@/lib/format";
import { useI18n } from "@/components/i18n";
import { CATEGORY_VALUES } from "@/lib/i18n/messages";

const fieldClass = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white";

const STOCK: StockStatus[] = ["in_stock", "low_stock", "out_of_stock"];

type CatalogFilter = "all" | "offered" | "not_offered" | "in_stock" | "low_stock" | "out_of_stock";

function stockLabel(
  status: StockStatus,
  t: { inStock: string; lowStock: string; outOfStock: string },
) {
  if (status === "in_stock") return t.inStock;
  if (status === "low_stock") return t.lowStock;
  return t.outOfStock;
}

export default function PharmacyDashboardPage() {
  const { user } = useAuth();
  const { coords } = useLocation();
  const { notify } = useToast();
  const { t, tx, category, orderStatus, formatDate, errorMessage } = useI18n();
  const allowed = user?.role === "pharmacy";
  const [pharmacy, setPharmacy] = useState<ManagedPharmacy | null>(null);
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    hours: "08:00 – 20:00",
    prepMinutes: 15,
  });
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<CatalogFilter>("all");
  const [busyPharmacy, setBusyPharmacy] = useState(false);
  const [savingSlug, setSavingSlug] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!allowed) return;
    getMyPharmacy()
      .then((row) => {
        setPharmacy(row);
        if (row) {
          setForm({
            name: row.name,
            address: row.address,
            phone: row.phone,
            hours: row.hours || "08:00 – 20:00",
            prepMinutes: row.prepMinutes,
          });
        }
      })
      .catch((err) => setError(errorMessage(err, "couldNotLoadPharmacy")));
  }, [allowed, errorMessage]);

  useEffect(() => {
    if (!pharmacy) return;
    listMyInventory()
      .then(setInventory)
      .catch((err) => setError(errorMessage(err, "couldNotLoadStock")));
    listPharmacyOrders(pharmacy.id)
      .then(setOrders)
      .catch(() => setOrders([]));
  }, [pharmacy, errorMessage]);

  const stats = useMemo(() => {
    const offered = inventory.filter((row) => row.offered);
    return {
      offered: offered.length,
      inStock: offered.filter((row) => row.stockStatus === "in_stock").length,
      lowStock: offered.filter((row) => row.stockStatus === "low_stock").length,
      outOfStock: offered.filter((row) => row.stockStatus === "out_of_stock").length,
    };
  }, [inventory]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return inventory.filter((row) => {
      if (categoryFilter !== "all" && row.category !== categoryFilter) return false;
      if (stockFilter === "offered" && !row.offered) return false;
      if (stockFilter === "not_offered" && row.offered) return false;
      if (stockFilter === "in_stock" && !(row.offered && row.stockStatus === "in_stock")) return false;
      if (stockFilter === "low_stock" && !(row.offered && row.stockStatus === "low_stock")) return false;
      if (stockFilter === "out_of_stock" && !(row.offered && row.stockStatus === "out_of_stock")) return false;
      if (!needle) return true;
      return `${row.name} ${row.genericName} ${row.category} ${row.dosage}`.toLowerCase().includes(needle);
    });
  }, [inventory, query, categoryFilter, stockFilter]);

  if (!allowed) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-white">{t.pharmacyDashboard}</h2>
        <p className="mt-3 text-gray-400">{t.pharmacyRestricted}</p>
      </div>
    );
  }

  async function onSavePharmacy(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusyPharmacy(true);
    try {
      const saved = await saveMyPharmacy({
        ...form,
        lat: coords?.lat ?? pharmacy?.lat ?? 4.0511,
        lng: coords?.lng ?? pharmacy?.lng ?? 9.7679,
      });
      setPharmacy(saved);
      notify(t.pharmacySaved);
      const rows = await listMyInventory();
      setInventory(rows);
    } catch (err) {
      setError(errorMessage(err, "couldNotSavePharmacy"));
    } finally {
      setBusyPharmacy(false);
    }
  }

  async function onStockChange(row: InventoryRow, next: { offered: boolean; stockStatus: StockStatus }) {
    setError("");
    setSavingSlug(row.slug);
    const previous = inventory;
    setInventory((current) =>
      current.map((item) => (item.slug === row.slug ? { ...item, ...next } : item)),
    );
    try {
      const saved = await setMyStockItem(row.slug, next.offered, next.stockStatus);
      setInventory((current) => current.map((item) => (item.slug === saved.slug ? saved : item)));
      notify(t.stockUpdated);
    } catch (err) {
      setInventory(previous);
      setError(errorMessage(err, "couldNotSaveStock"));
    } finally {
      setSavingSlug("");
    }
  }

  const filters: { id: CatalogFilter; label: string }[] = [
    { id: "all", label: t.filterAll },
    { id: "offered", label: t.offered },
    { id: "not_offered", label: t.notOffered },
    { id: "in_stock", label: t.inStock },
    { id: "low_stock", label: t.lowStock },
    { id: "out_of_stock", label: t.outOfStock },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-white">{t.pharmacyDashboard}</h2>
      <p className="mt-2 text-sm text-gray-400">{t.pharmacyDashHint}</p>
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

      <form onSubmit={onSavePharmacy} className="mt-6 grid gap-3 md:grid-cols-2">
        <input
          required
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder={t.pharmacyName}
          className={fieldClass}
        />
        <input
          required
          value={form.address}
          onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
          placeholder={t.streetNeighbourhood}
          className={fieldClass}
        />
        <input
          value={form.phone}
          onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
          placeholder={t.phone}
          className={fieldClass}
        />
        <input
          value={form.hours}
          onChange={(event) => setForm((current) => ({ ...current, hours: event.target.value }))}
          placeholder={t.openingHours}
          className={fieldClass}
        />
        <input
          type="number"
          min={0}
          value={form.prepMinutes}
          onChange={(event) => setForm((current) => ({ ...current, prepMinutes: Number(event.target.value) }))}
          placeholder={t.preparationMinutes}
          className={fieldClass}
        />
        <Button type="submit" busy={busyPharmacy} className="md:mt-0">
          {busyPharmacy ? t.saving : pharmacy ? t.savePharmacy : t.createPharmacy}
        </Button>
      </form>

      <div className="mt-10">
        <h3 className="text-lg font-semibold text-white">{t.yourCatalog}</h3>
        <p className="text-sm text-gray-400">{t.catalogHint}</p>
      </div>

      {!pharmacy ? (
        <p className="mt-4 text-gray-400">{t.savePharmacyFirstCatalog}</p>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={tx("offeredCount", { count: stats.offered })} />
            <Stat label={tx("inStockCount", { count: stats.inStock })} />
            <Stat label={tx("lowStockCount", { count: stats.lowStock })} />
            <Stat label={tx("outOfStockCount", { count: stats.outOfStock })} />
          </div>

          <div className="mt-4">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.searchCatalog}
              className={fieldClass}
            />
          </div>

          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-gray-300">{t.category}</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t.category}>
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={
                  categoryFilter === "all"
                    ? "rounded-full bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-black"
                    : "rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/10"
                }
              >
                {t.allCategories}
              </button>
              {CATEGORY_VALUES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategoryFilter(value)}
                  className={
                    categoryFilter === value
                      ? "rounded-full bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-black"
                      : "rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/10"
                  }
                >
                  {category(value)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setStockFilter(filter.id)}
                className={
                  stockFilter === filter.id
                    ? "rounded-full bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-black"
                    : "rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/10"
                }
              >
                {filter.label}
              </button>
            ))}
          </div>

          {inventory.length === 0 ? (
            <p className="mt-4 text-gray-400">{t.noMedicationsYet}</p>
          ) : visible.length === 0 ? (
            <p className="mt-4 text-gray-400">{t.noCatalogMatch}</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-white/5">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/5 text-gray-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t.offered}</th>
                    <th className="px-4 py-3 font-medium">{t.medication}</th>
                    <th className="px-4 py-3 font-medium">{t.category}</th>
                    <th className="px-4 py-3 font-medium">{t.nationalPrice}</th>
                    <th className="px-4 py-3 font-medium">{t.inStock}</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => (
                    <tr key={row.slug} className="border-t border-white/5">
                      <td className="px-4 py-3">
                        <label className="flex items-center gap-2 text-gray-200">
                          <input
                            type="checkbox"
                            checked={row.offered}
                            disabled={savingSlug === row.slug}
                            aria-label={`${t.offerThis}: ${row.name}`}
                            onChange={(event) =>
                              onStockChange(row, {
                                offered: event.target.checked,
                                stockStatus: event.target.checked
                                  ? row.stockStatus === "out_of_stock"
                                    ? "in_stock"
                                    : row.stockStatus
                                  : row.stockStatus,
                              })
                            }
                            className="size-4 accent-emerald-500"
                          />
                        </label>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{row.name}</p>
                        <p className="text-xs text-gray-500">
                          {row.genericName} · {row.dosage}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{category(row.category)}</td>
                      <td className="px-4 py-3 text-emerald-400">
                        {formatMoney(row.aidcelixPrice, row.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="flex flex-wrap gap-1.5"
                          role="group"
                          aria-label={tx("stockFor", { name: row.name })}
                        >
                          {STOCK.map((status) => {
                            const active = row.offered && row.stockStatus === status;
                            return (
                              <button
                                key={status}
                                type="button"
                                disabled={savingSlug === row.slug}
                                onClick={() => onStockChange(row, { offered: true, stockStatus: status })}
                                className={
                                  active
                                    ? status === "out_of_stock"
                                      ? "rounded-full bg-red-500 px-3 py-1.5 text-xs font-semibold text-white"
                                      : status === "low_stock"
                                        ? "rounded-full bg-amber-400 px-3 py-1.5 text-xs font-semibold text-black"
                                        : "rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black"
                                    : "rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/10 disabled:opacity-40"
                                }
                              >
                                {stockLabel(status, t)}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <h3 className="mt-10 text-lg font-semibold text-white">{t.incomingCommands}</h3>
      <div className="mt-4 space-y-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            prefetch
            data-press
            className="block rounded-2xl border border-white/5 bg-white/5 p-4 hover:border-emerald-500/30"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">{t.pickupCode}</p>
                <p className="font-mono text-2xl font-bold tracking-[0.22em] text-white">{formatPickupCode(order.pickupCode)}</p>
                <p className="mt-1 font-semibold text-white">{order.customerName}</p>
              </div>
              <p className="text-emerald-400">{formatMoney(order.grandTotal, order.currency)}</p>
            </div>
            <p className="mt-2 text-sm text-gray-300">
              {order.items.map((item) => item.name).join(", ")}
            </p>
            <p className="mt-1 text-sm text-gray-400">
              {order.dropoff.contact ? `${order.dropoff.contact} · ` : ""}
              {formatDate(order.createdAt)} · {orderStatus(order.status)}
            </p>
          </Link>
        ))}
        {pharmacy && orders.length === 0 ? <p className="text-gray-400">{t.noPharmacyOrders}</p> : null}
      </div>
    </div>
  );
}

function Stat({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-gray-200">
      {label}
    </div>
  );
}
