"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { BrandLogo } from "@/components/brand/logo";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n";

export default function AdminLoginPage() {
  const { login, user, ready } = useAuth();
  const router = useRouter();
  const { t, errorMessage } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user?.role === "admin") router.replace("/admin");
  }, [ready, user, router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password, "staff");
      router.replace("/admin");
    } catch (err) {
      setError(errorMessage(err, "staffOnly"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-zinc-950 px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/60 p-8">
        <BrandLogo className="mb-6 justify-center" />
        <h1 className="text-center text-2xl font-bold text-white">{t.staffPortal}</h1>
        <p className="mt-2 text-center text-sm text-gray-400">{t.staffLoginHint}</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t.email}
            autoComplete="username"
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
            {busy ? t.loggingIn : t.staffLogin}
          </Button>
        </form>
      </div>
    </div>
  );
}
