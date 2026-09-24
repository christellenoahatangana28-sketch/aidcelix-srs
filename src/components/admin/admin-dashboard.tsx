"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  assignPharmacyOwner,
  cancelAdminOrder,
  getAdminOverview,
  listAdminActivity,
  listAdminCatalog,
  listAdminPharmacies,
  listAdminUsers,
  setAdminPrice,
  setUserRole,
  deleteAdminUser,
  updateAdminPharmacy,
  type AdminActivity,
  type AdminCatalogRow,
  type AdminOverview,
  type AdminPharmacy,
  type AdminUser,
  type UserRole,
} from "@/lib/dashboard";
import { advanceDelivery, listAllOrders, type OrderStatus, type StoredOrder } from "@/lib/orders";
import { formatMoney } from "@/lib/format";
import { useI18n } from "@/components/i18n";
import { cn } from "@/lib/cn";

const ROLES: UserRole[] = ["customer", "pharmacy"];
const ORDER_FILTERS: Array<"all" | OrderStatus> = [
  "all",
  "pending_payment",
  "failed_payment",
  "notified_gozem",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
];
const fieldClass = "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white";

type Tab = "overview" | "users" | "pharmacies" | "orders" | "catalog" | "activity";

export function AdminDashboard() {
  const { user } = useAuth();
  const { notify } = useToast();
  const { t, roleLabel, orderStatus, formatDate, errorMessage, category } = useI18n();
  const [tab, setTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [pharmacies, setPharmacies] = useState<AdminPharmacy[]>([]);
  const [catalog, setCatalog] = useState<AdminCatalogRow[]>([]);
  const [activity, setActivity] = useState<AdminActivity[]>([]);
  const [error, setError] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [pharmacyQuery, setPharmacyQuery] = useState("");
  const [orderQuery, setOrderQuery] = useState("");
  const [orderFilter, setOrderFilter] = useState<(typeof ORDER_FILTERS)[number]>("all");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [editing, setEditing] = useState<AdminPharmacy | null>(null);
  const [assignFor, setAssignFor] = useState<Record<string, string>>({});
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [busyId, setBusyId] = useState("");
  const isAdmin = user?.role === "admin";

  async function load() {
    const [stats, people, cmds, locations, meds, events] = await Promise.all([
      getAdminOverview(),
      listAdminUsers(),
      listAllOrders(),
      listAdminPharmacies(),
      listAdminCatalog(),
      listAdminActivity(),
    ]);
    setOverview(stats);
    setUsers(people);
    setOrders(cmds);
    setPharmacies(locations);
    setCatalog(meds);
    setActivity(events);
    setPrices(Object.fromEntries(meds.map((row) => [row.id, String(row.aidcelixPrice)])));
  }

  useEffect(() => {
    if (!isAdmin) return;
    load().catch((err) => setError(errorMessage(err, "couldNotLoadAdmin")));
  }, [isAdmin]);

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((row) =>
      [row.fullName, row.email, row.phone, row.role].join(" ").toLowerCase().includes(q),
    );
  }, [users, userQuery]);

  const filteredPharmacies = useMemo(() => {
    const q = pharmacyQuery.trim().toLowerCase();
    if (!q) return pharmacies;
    return pharmacies.filter((row) =>
      [row.name, row.address, row.ownerName, row.ownerEmail].join(" ").toLowerCase().includes(q),
    );
  }, [pharmacies, pharmacyQuery]);

  const filteredOrders = useMemo(() => {
    const q = orderQuery.trim().toLowerCase();
    return orders.filter((order) => {
      if (orderFilter !== "all" && order.status !== orderFilter) return false;
      if (!q) return true;
      return [order.pharmacyName, order.customerName ?? "", order.pickupCode, order.status, order.id]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [orders, orderFilter, orderQuery]);

  const filteredCatalog = useMemo(() => {
    const q = catalogQuery.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((row) =>
      [row.name, row.genericName, row.category, row.dosage].join(" ").toLowerCase().includes(q),
    );
  }, [catalog, catalogQuery]);

  async function onRole(userId: string, role: UserRole) {
    try {
      await setUserRole(userId, role);
      setUsers((current) => current.map((row) => (row.id === userId ? { ...row, role } : row)));
      notify(t.roleUpdated);
    } catch (err) {
      notify(errorMessage(err, "couldNotUpdateRole"));
    }
  }

  async function onDeleteUser(userId: string) {
    setBusyId(userId);
    try {
      await deleteAdminUser(userId);
      setUsers((current) => current.filter((row) => row.id !== userId));
      setConfirmDelete(null);
      notify(t.accountDeleted);
      const stats = await getAdminOverview();
      setOverview(stats);
    } catch (err) {
      notify(errorMessage(err, "couldNotDeleteAccount"));
    } finally {
      setBusyId("");
    }
  }

  async function onAssign(pharmacyId: string) {
    const userId = assignFor[pharmacyId];
    if (!userId) return;
    setBusyId(pharmacyId);
    try {
      await assignPharmacyOwner(pharmacyId, userId);
      await load();
      notify(t.ownerAssigned);
    } catch (err) {
      notify(errorMessage(err, "couldNotAssignOwner"));
    } finally {
      setBusyId("");
    }
  }

  async function onSavePharmacy(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setBusyId(editing.id);
    try {
      await updateAdminPharmacy({
        id: editing.id,
        name: editing.name,
        address: editing.address,
        phone: editing.phone,
        hours: editing.hours,
        prepMinutes: editing.prepMinutes,
      });
      await load();
      setEditing(null);
      notify(t.pharmacyUpdated);
    } catch (err) {
      notify(errorMessage(err, "couldNotUpdatePharmacy"));
    } finally {
      setBusyId("");
    }
  }

  async function onCancel(orderId: string) {
    setBusyId(orderId);
    try {
      await cancelAdminOrder(orderId);
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, status: "cancelled" } : order)),
      );
      setConfirmCancel(null);
      notify(t.commandWasCancelled);
      const stats = await getAdminOverview();
      setOverview(stats);
    } catch (err) {
      notify(errorMessage(err, "couldNotCancel"));
    } finally {
      setBusyId("");
    }
  }

  async function onAdvance(orderId: string) {
    setBusyId(orderId);
    try {
      await advanceDelivery(orderId);
      const refreshed = await listAllOrders();
      setOrders(refreshed);
      notify(t.deliveryAdvanced);
      const stats = await getAdminOverview();
      setOverview(stats);
    } catch (err) {
      notify(errorMessage(err, "couldNotAdvance"));
    } finally {
      setBusyId("");
    }
  }

  async function onSavePrice(row: AdminCatalogRow) {
    const value = Number(prices[row.id]);
    if (!Number.isFinite(value) || value <= 0) {
      notify(t.priceMustBePositive);
      return;
    }
    setBusyId(row.id);
    try {
      await setAdminPrice(row.id, value);
      setCatalog((current) =>
        current.map((item) => (item.id === row.id ? { ...item, aidcelixPrice: value } : item)),
      );
      notify(t.priceSaved);
    } catch (err) {
      notify(errorMessage(err, "couldNotSavePrice"));
    } finally {
      setBusyId("");
    }
  }

  if (!isAdmin) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: t.overview },
    { id: "users", label: t.users },
    { id: "pharmacies", label: t.pharmacies },
    { id: "orders", label: t.allCommands },
    { id: "catalog", label: t.catalog },
    { id: "activity", label: t.activity },
  ];

  const stats = [
    [t.users, overview?.users],
    [t.pharmacyAccounts, overview?.pharmacyAccounts],
    [t.locations, overview?.pharmacyLocations],
    [t.catalog, overview?.medications],
    [t.openOrders, overview?.openOrders],
    [t.gmv, overview ? formatMoney(overview.gmv, "XAF") : "—"],
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-white">{t.platformControl}</h2>
      <p className="mt-2 text-sm text-gray-400">{t.adminDashHint}</p>
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

      <nav className="mt-6 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            data-press
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold",
              tab === item.id
                ? "bg-emerald-500 text-black"
                : "border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white",
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === "overview" ? (
        <div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {stats.map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-wide text-emerald-400">{label}</p>
                <p className="mt-2 text-2xl font-bold text-white">{value ?? "—"}</p>
              </div>
            ))}
          </div>
          <h3 className="mt-10 text-lg font-semibold text-white">{t.attention}</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                { label: t.pendingPayment, value: overview?.pendingPayment, filter: "pending_payment" as const },
                { label: t.failedPayments, value: overview?.failedPayments, filter: "failed_payment" as const },
                { label: t.activeDeliveries, value: overview?.activeDeliveries, filter: "out_for_delivery" as const },
                { label: t.unassignedPharmacy, value: pharmacies.filter((row) => !row.ownerId).length, filter: null },
              ] as const
            ).map((item) => (
              <button
                key={item.label}
                type="button"
                className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-left hover:border-amber-400/40"
                onClick={() => {
                  if (item.filter) {
                    setOrderFilter(item.filter);
                    setTab("orders");
                  } else {
                    setTab("pharmacies");
                  }
                }}
              >
                <p className="text-xs uppercase tracking-wide text-amber-300">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-white">{item.value ?? "—"}</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {tab === "users" ? (
        <section className="mt-8">
          <input
            value={userQuery}
            onChange={(event) => setUserQuery(event.target.value)}
            placeholder={t.searchUsers}
            className={cn(fieldClass, "max-w-md")}
          />
          <div className="mt-4 overflow-x-auto rounded-2xl border border-white/5">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/5 text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">{t.name}</th>
                  <th className="px-4 py-3 font-medium">{t.email}</th>
                  <th className="px-4 py-3 font-medium">{t.role}</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((row) => (
                  <tr key={row.id} className="border-t border-white/5">
                    <td className="px-4 py-3 text-white">
                      {row.fullName}
                      <p className="text-xs text-gray-500">{row.phone || t.noPhone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{row.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={row.role}
                        onChange={(event) => onRole(row.id, event.target.value as UserRole)}
                        className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-white"
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {roleLabel(role)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {row.role !== "admin" && row.id !== user?.id ? (
                        confirmDelete === row.id ? (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="compact"
                              busy={busyId === row.id}
                              onClick={() => onDeleteUser(row.id)}
                            >
                              {t.confirmDeleteAccount}
                            </Button>
                            <Button type="button" variant="ghost" size="compact" onClick={() => setConfirmDelete(null)}>
                              {t.keepAccount}
                            </Button>
                          </div>
                        ) : (
                          <Button type="button" variant="ghost" size="compact" onClick={() => setConfirmDelete(row.id)}>
                            {t.deleteAccount}
                          </Button>
                        )
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 ? <p className="mt-4 text-gray-400">{t.noMatchingUsers}</p> : null}
        </section>
      ) : null}

      {tab === "pharmacies" ? (
        <section className="mt-8">
          <input
            value={pharmacyQuery}
            onChange={(event) => setPharmacyQuery(event.target.value)}
            placeholder={t.searchPharmacies}
            className={cn(fieldClass, "max-w-md")}
          />
          {editing ? (
            <form onSubmit={onSavePharmacy} className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-2">
              <p className="md:col-span-2 font-semibold text-white">{t.editPharmacy}</p>
              <input
                value={editing.name}
                onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                className={fieldClass}
                required
              />
              <input
                value={editing.address}
                onChange={(event) => setEditing({ ...editing, address: event.target.value })}
                className={fieldClass}
                required
              />
              <input
                value={editing.phone}
                onChange={(event) => setEditing({ ...editing, phone: event.target.value })}
                className={fieldClass}
              />
              <input
                value={editing.hours}
                onChange={(event) => setEditing({ ...editing, hours: event.target.value })}
                className={fieldClass}
              />
              <input
                type="number"
                min={0}
                value={editing.prepMinutes}
                onChange={(event) => setEditing({ ...editing, prepMinutes: Number(event.target.value) })}
                className={fieldClass}
              />
              <div className="flex gap-2 md:col-span-2">
                <Button type="submit" busy={busyId === editing.id}>
                  {t.save}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                  {t.close}
                </Button>
              </div>
            </form>
          ) : null}
          <div className="mt-4 grid gap-3">
            {filteredPharmacies.map((pharmacy) => (
              <div key={pharmacy.id} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={`/pharmacies/${pharmacy.slug}`} className="font-semibold text-white hover:text-emerald-300">
                      {pharmacy.name}
                    </Link>
                    <p className="mt-1 text-sm text-gray-400">{pharmacy.address}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {t.owner}: {pharmacy.ownerName || t.unassigned}
                      {pharmacy.ownerEmail ? ` · ${pharmacy.ownerEmail}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {t.stockedItems}: {pharmacy.stockedItems} · {t.orderCount}: {pharmacy.orderCount}
                    </p>
                  </div>
                  <Button type="button" variant="secondary" size="compact" onClick={() => setEditing(pharmacy)}>
                    {t.manage}
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <select
                    value={assignFor[pharmacy.id] ?? ""}
                    onChange={(event) => setAssignFor((current) => ({ ...current, [pharmacy.id]: event.target.value }))}
                    className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm text-white"
                  >
                    <option value="">{t.selectOwner}</option>
                    {users.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.fullName} · {roleLabel(row.role)}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    size="compact"
                    busy={busyId === pharmacy.id}
                    onClick={() => onAssign(pharmacy.id)}
                    disabled={!assignFor[pharmacy.id]}
                  >
                    {t.assignOwner}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {filteredPharmacies.length === 0 ? <p className="mt-4 text-gray-400">{t.noMatchingPharmacies}</p> : null}
        </section>
      ) : null}

      {tab === "orders" ? (
        <section className="mt-8">
          <div className="flex flex-wrap gap-2">
            {ORDER_FILTERS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setOrderFilter(status)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold",
                  orderFilter === status
                    ? "bg-emerald-500 text-black"
                    : "border border-white/10 bg-white/5 text-gray-400",
                )}
              >
                {status === "all" ? t.filterAll : orderStatus(status)}
              </button>
            ))}
          </div>
          <input
            value={orderQuery}
            onChange={(event) => setOrderQuery(event.target.value)}
            placeholder={t.searchOrders}
            className={cn(fieldClass, "mt-4 max-w-md")}
          />
          <div className="mt-4 space-y-3">
            {filteredOrders.map((order) => (
              <div key={order.id} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{order.pharmacyName}</p>
                    <p className="font-mono text-sm font-bold tracking-[0.18em] text-emerald-300">{order.pickupCode}</p>
                    <p className="text-sm text-gray-400">
                      {order.customerName ? `${order.customerName} · ` : ""}
                      {formatDate(order.createdAt)} · {orderStatus(order.status)}
                    </p>
                  </div>
                  <p className="text-emerald-400">{formatMoney(order.grandTotal, order.currency)}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/orders/${order.id}`}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 hover:text-white"
                  >
                    {t.viewOrder}
                  </Link>
                  {order.deliveryStatus && order.deliveryStatus !== "delivered" && order.status !== "cancelled" ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="compact"
                      busy={busyId === order.id}
                      onClick={() => onAdvance(order.id)}
                    >
                      {t.advanceDelivery}
                    </Button>
                  ) : null}
                  {order.status !== "delivered" && order.status !== "cancelled" ? (
                    confirmCancel === order.id ? (
                      <>
                        <Button
                          type="button"
                          size="compact"
                          busy={busyId === order.id}
                          onClick={() => onCancel(order.id)}
                        >
                          {t.confirmCancel}
                        </Button>
                        <Button type="button" variant="ghost" size="compact" onClick={() => setConfirmCancel(null)}>
                          {t.keepOrder}
                        </Button>
                      </>
                    ) : (
                      <Button type="button" variant="ghost" size="compact" onClick={() => setConfirmCancel(order.id)}>
                        {t.cancelOrder}
                      </Button>
                    )
                  ) : null}
                </div>
              </div>
            ))}
            {filteredOrders.length === 0 ? <p className="text-gray-400">{t.noCommandsYet}</p> : null}
          </div>
        </section>
      ) : null}

      {tab === "catalog" ? (
        <section className="mt-8">
          <input
            value={catalogQuery}
            onChange={(event) => setCatalogQuery(event.target.value)}
            placeholder={t.searchCatalog}
            className={cn(fieldClass, "max-w-md")}
          />
          <div className="mt-4 overflow-x-auto rounded-2xl border border-white/5">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/5 text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">{t.medication}</th>
                  <th className="px-4 py-3 font-medium">{t.category}</th>
                  <th className="px-4 py-3 font-medium">{t.priceXaf}</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {filteredCatalog.map((row) => (
                  <tr key={row.id} className="border-t border-white/5">
                    <td className="px-4 py-3 text-white">
                      {row.name}
                      <p className="text-xs text-gray-500">
                        {row.genericName} · {row.dosage}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{category(row.category)}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={1}
                        value={prices[row.id] ?? ""}
                        onChange={(event) =>
                          setPrices((current) => ({ ...current, [row.id]: event.target.value }))
                        }
                        className="w-28 rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-white"
                        aria-label={t.priceXaf}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        size="compact"
                        busy={busyId === row.id}
                        onClick={() => onSavePrice(row)}
                      >
                        {t.savePrice}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredCatalog.length === 0 ? <p className="mt-4 text-gray-400">{t.noMatchingCatalog}</p> : null}
        </section>
      ) : null}

      {tab === "activity" ? (
        <section className="mt-8">
          <p className="text-sm text-gray-400">{t.platformActivity}</p>
          <div className="mt-4 space-y-2">
            {activity.map((event) => (
              <div key={event.id} className="rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                <p className="text-sm text-white">{event.action}</p>
                <p className="text-xs text-gray-500">
                  {event.actorName} · {formatDate(event.createdAt)}
                </p>
              </div>
            ))}
            {activity.length === 0 ? <p className="text-gray-400">{t.noActivity}</p> : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
