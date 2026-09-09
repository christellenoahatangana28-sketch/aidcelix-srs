"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { BrandLogo } from "@/components/brand/logo";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    password: "",
  });
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await register(form);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not register");
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <BrandLogo className="mb-8 justify-center" />
      <h1 className="text-center text-3xl font-bold text-white">Create your account</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-3">
        {(
          [
            ["fullName", "Full name"],
            ["email", "Email"],
            ["phone", "Phone"],
            ["address", "Delivery address"],
            ["password", "Password"],
          ] as const
        ).map(([key, placeholder]) => (
          <input
            key={key}
            required
            type={key === "password" ? "password" : key === "email" ? "email" : "text"}
            value={form[key]}
            onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
            placeholder={placeholder}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
          />
        ))}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button type="submit" className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-black">
          Register
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-400">
        Already have an account?{" "}
        <Link href="/login" className="text-emerald-400">
          Login
        </Link>
      </p>
    </div>
  );
}
