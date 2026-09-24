"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/components/i18n";

export default function ProfilePage() {
  const { user, ready, logout, updateProfile } = useAuth();
  const router = useRouter();
  const { notify } = useToast();
  const { t, errorMessage } = useI18n();
  const [form, setForm] = useState({ fullName: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/profile");
    if (user) setForm({ fullName: user.fullName, phone: user.phone });
  }, [ready, user, router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setSaved(false);
    try {
      await updateProfile(form);
      setSaved(true);
      notify(t.profileSaved);
      window.setTimeout(() => setSaved(false), 1600);
    } catch (err) {
      notify(errorMessage(err, "couldNotSaveProfile"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-3xl font-bold text-white">{t.profile}</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input
          value={form.fullName}
          onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
          placeholder={t.fullName}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <input
          value={form.phone}
          onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
          placeholder={t.phone}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <p className="text-sm text-gray-500">{user?.email ?? ""}</p>
        <p className="text-xs text-gray-500">{t.profileAddressHint}</p>
        <Button type="submit" size="lg" busy={busy} success={saved}>
          {busy ? t.saving : saved ? t.saved : t.save}
        </Button>
      </form>
      <Link href="/dashboard" prefetch data-press className="mt-4 block text-center text-emerald-400">
        {t.openDashboard}
      </Link>
      <Link href="/orders" prefetch data-press className="mt-2 block text-center text-emerald-400">
        {t.orderHistory}
      </Link>
      <Button
        type="button"
        variant="ghost"
        size="lg"
        className="mt-2 font-medium"
        onClick={async () => {
          await logout();
          router.push("/");
        }}
      >
        {t.logOut}
      </Button>
    </div>
  );
}
