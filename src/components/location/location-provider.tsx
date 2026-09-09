"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { GeoPoint } from "@/lib/geo";

const STORAGE_KEY = "aidcelix.location";

export type LocationState = {
  coords: GeoPoint | null;
  label: string;
  status: "idle" | "locating" | "ready" | "denied" | "error";
  setManual: (coords: GeoPoint, label: string) => void;
  retryGps: () => void;
};

const LocationContext = createContext<LocationState | null>(null);

function readStored(): { coords: GeoPoint; label: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [coords, setCoords] = useState<GeoPoint | null>(null);
  const [label, setLabel] = useState("Detecting location…");
  const [status, setStatus] = useState<LocationState["status"]>("idle");

  const persist = useCallback((point: GeoPoint, nextLabel: string) => {
    setCoords(point);
    setLabel(nextLabel);
    setStatus("ready");
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ coords: point, label: nextLabel }));
  }, []);

  const requestGps = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("error");
      setLabel("Enter an address");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const point = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const resolved = await reverseGeocode(point);
        persist(point, resolved);
      },
      () => {
        const stored = readStored();
        if (stored) {
          persist(stored.coords, stored.label);
          return;
        }
        setStatus("denied");
        setLabel("Location needed");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    );
  }, [persist]);

  useEffect(() => {
    const stored = readStored();
    if (stored) persist(stored.coords, stored.label);
    requestGps();
  }, [persist, requestGps]);

  const setManual = useCallback(
    (point: GeoPoint, nextLabel: string) => {
      persist(point, nextLabel);
    },
    [persist],
  );

  const value = useMemo(
    () => ({ coords, label, status, setManual, retryGps: requestGps }),
    [coords, label, status, setManual, requestGps],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used within LocationProvider");
  return ctx;
}

async function reverseGeocode(point: GeoPoint): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${point.lat}&lon=${point.lng}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("geocode failed");
    const data = (await res.json()) as {
      address?: { suburb?: string; city?: string; town?: string; village?: string; country?: string };
    };
    const place =
      data.address?.suburb ||
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      "Current location";
    return data.address?.country ? `${place}, ${data.address.country}` : place;
  } catch {
    return "Current location";
  }
}
