"use client";

import Link from "next/link";
import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { useLocation } from "@/components/location/location-provider";

export function LocationChip() {
  const { label, status, setManual, retryGps } = useLocation();
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState("");

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => (status === "denied" || status === "error" ? setOpen(true) : retryGps())}
        className="inline-flex max-w-[220px] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-left text-xs text-emerald-300 hover:bg-white/10"
      >
        {status === "locating" || status === "idle" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <MapPin className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="truncate">{label}</span>
      </button>
      {(status === "denied" || status === "error" || open) && (
        <form
          className="absolute left-0 top-full z-40 mt-2 w-72 rounded-xl border border-white/15 bg-black/95 p-3 shadow-xl"
          onSubmit={(event) => {
            event.preventDefault();
            setManual({ lat: 4.0511, lng: 9.7679 }, address || "Akwa, Douala");
            setOpen(false);
          }}
        >
          <p className="mb-2 text-xs text-gray-400">GPS blocked. Enter a delivery area.</p>
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Akwa, Douala"
            className="mb-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-black"
          >
            Use this area
          </button>
        </form>
      )}
      <Link href="/search" className="sr-only">
        Search
      </Link>
    </div>
  );
}
