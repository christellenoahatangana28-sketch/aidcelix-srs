"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";
import { useLocation } from "@/components/location/location-provider";
import { useI18n } from "@/components/i18n";
import { cn } from "@/lib/cn";

export function LocationChip({ className }: { className?: string }) {
  const { label, status, setManual, retryGps } = useLocation();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState("");
  const displayLabel =
    status === "locating" || status === "idle"
      ? t.detectingLocation
      : status === "denied"
        ? t.locationNeeded
        : status === "error"
          ? t.enterAddress
          : label === "Current location" || label === "Position actuelle" || label === "Detecting location…"
            ? t.currentLocation
            : label;

  return (
    <div className={cn("relative min-w-0", className)}>
      <Button
        type="button"
        variant="chip"
        size="compact"
        onClick={() => (status === "denied" || status === "error" ? setOpen(true) : retryGps())}
        className="w-full max-w-full justify-start rounded-full font-medium md:w-auto md:max-w-[220px]"
      >
        {status === "locating" || status === "idle" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <MapPin className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="truncate">{displayLabel}</span>
      </Button>
      {(status === "denied" || status === "error" || open) && (
        <form
          className="absolute left-0 top-full z-40 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-white/15 bg-black/95 p-3 shadow-xl"
          onSubmit={(event) => {
            event.preventDefault();
            setManual({ lat: 4.0511, lng: 9.7679 }, address || "Akwa, Douala");
            setOpen(false);
          }}
        >
          <p className="mb-2 text-xs text-gray-400">{t.gpsBlocked}</p>
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Akwa, Douala"
            className="mb-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          />
          <Button type="submit" size="lg">
            {t.useThisArea}
          </Button>
        </form>
      )}
      <Link href="/search" className="sr-only">
        {t.search}
      </Link>
    </div>
  );
}
