"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";

export default function ProfilePage() {
  const { user, ready, logout, updateProfile } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", phone: "", address: "" });

  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/profile");
    if (user) setForm({ fullName: user.fullName, phone: user.phone, address: user.address });
  }, [ready, user, router]);

  if (!user) return null;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    updateProfile(form);
  }

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-3xl font-bold text-white">Profile</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input
          value={form.fullName}
          onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <input
          value={form.phone}
          onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <input
          value={form.address}
          onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <p className="text-sm text-gray-500">{user.email}</p>
        <button type="submit" className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-black">
          Save
        </button>
      </form>
      <Link href="/orders" className="mt-4 block text-center text-emerald-400">
        Order history
      </Link>
      <button
        type="button"
        onClick={() => {
          logout();
          router.push("/");
        }}
        className="mt-4 w-full text-sm text-gray-500"
      >
        Log out
      </button>
    </div>
  );
}
