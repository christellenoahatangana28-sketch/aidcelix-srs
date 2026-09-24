"use client";

import { formatPickupCode } from "@/lib/format";

export function PickupCode({
  code,
  label,
  hint,
}: {
  code: string;
  label: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">{label}</p>
      <p className="mt-1 font-mono text-3xl font-bold tracking-[0.28em] text-white">{formatPickupCode(code)}</p>
      <p className="mt-2 text-sm text-white/80">{hint}</p>
    </div>
  );
}
