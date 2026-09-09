"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { BrandLogo } from "@/components/brand/logo";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await login(identifier, password);
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <BrandLogo className="mb-8 justify-center" />
      <h1 className="text-center text-3xl font-bold text-white">Welcome back</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <input
          required
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="Email or phone"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <input
          required
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button type="submit" className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-black">
          Login
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-400">
        <Link href="/forgot-password" className="text-emerald-400">
          Forgot password
        </Link>
        {" · "}
        <Link href="/register" className="text-emerald-400">
          Create account
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
