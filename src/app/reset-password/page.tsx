"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { t, errorMessage } = useI18n();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      router.push("/profile");
    } catch (err) {
      setError(errorMessage(err, "couldNotUpdatePassword"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-center text-3xl font-bold text-white">{t.chooseNewPassword}</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <PasswordInput
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={t.newPassword}
          autoComplete="new-password"
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <Button type="submit" size="lg" busy={busy}>
          {busy ? t.saving : t.updatePassword}
        </Button>
      </form>
    </div>
  );
}
