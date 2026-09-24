"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { BrandLogo } from "@/components/brand/logo";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { dashboardHome } from "@/lib/dashboard";
import { cn } from "@/lib/cn";
import { useI18n } from "@/components/i18n";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const { t, errorMessage } = useI18n();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    accountType: "customer" as "customer" | "pharmacy",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(form);
      router.push(dashboardHome(form.accountType));
    } catch (err) {
      setError(errorMessage(err, "couldNotRegister"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <BrandLogo className="mb-8 justify-center" />
      <h1 className="text-center text-3xl font-bold text-white">{t.createYourAccount}</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["customer", t.iAmCustomer],
              ["pharmacy", t.iAmPharmacy],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm((current) => ({ ...current, accountType: value }))}
              className={cn(
                "rounded-xl border px-3 py-3 text-sm font-semibold",
                form.accountType === value
                  ? "border-emerald-400 bg-emerald-500 text-black"
                  : "border-white/10 bg-white/5 text-gray-300",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {(
          [
            ["fullName", t.fullName, "text"],
            ["email", t.email, "email"],
            ["phone", t.phone, "tel"],
          ] as const
        ).map(([key, placeholder, type]) => (
          <input
            key={key}
            required
            type={type}
            value={form[key]}
            onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
            placeholder={placeholder}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
          />
        ))}
        <PasswordInput
          required
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          placeholder={t.password}
          autoComplete="new-password"
        />
        <p className="text-xs text-gray-500">
          {t.registerHint}
        </p>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <Button type="submit" size="lg" busy={busy}>
          {busy ? t.creatingAccount : t.register}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-400">
        {t.alreadyHaveAccount}{" "}
        <Link href="/login" prefetch className="text-emerald-400">
          {t.login}
        </Link>
      </p>
    </div>
  );
}
