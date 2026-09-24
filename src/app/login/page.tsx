"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { BrandLogo } from "@/components/brand/logo";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const { t, errorMessage } = useI18n();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(identifier, password, "store");
      router.push(next);
    } catch (err) {
      setError(errorMessage(err, "loginFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <BrandLogo className="mb-8 justify-center" />
      <h1 className="text-center text-3xl font-bold text-white">{t.welcomeBack}</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <input
          required
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder={t.email}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <PasswordInput
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={t.password}
          autoComplete="current-password"
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <Button type="submit" size="lg" busy={busy}>
          {busy ? t.loggingIn : t.login}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-400">
        <Link href="/forgot-password" prefetch className="text-emerald-400">
          {t.forgotPassword}
        </Link>
        {" · "}
        <Link href="/register" prefetch className="text-emerald-400">
          {t.createAccount}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
