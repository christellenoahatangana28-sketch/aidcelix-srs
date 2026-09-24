"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n";

export default function ForgotPasswordPage() {
  const { t, errorMessage } = useI18n();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (resetError) throw resetError;
      setMessage(t.resetEmailSent);
    } catch (err) {
      setError(errorMessage(err, "couldNotSendReset"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <BrandLogo className="mb-8 justify-center" />
      <h1 className="text-center text-3xl font-bold text-white">{t.resetPassword}</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t.email}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
        <Button type="submit" size="lg" busy={busy}>
          {busy ? t.sending : t.sendResetLink}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-400">
        <Link href="/login" prefetch className="text-emerald-400">
          {t.backToLogin}
        </Link>
      </p>
    </div>
  );
}
