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
import type { User as AuthUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type UserRole = "customer" | "pharmacy" | "admin";

export type User = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  role: UserRole;
};

type RegisterInput = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  accountType: "customer" | "pharmacy";
};

type AuthState = {
  user: User | null;
  ready: boolean;
  register: (input: RegisterInput) => Promise<void>;
  login: (identifier: string, password: string, portal?: "store" | "staff") => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

async function loadAppUser(authUser: AuthUser): Promise<User> {
  const supabase = createClient();
  const [{ data: profile }, { data: address }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone, role").eq("id", authUser.id).maybeSingle(),
    supabase
      .from("addresses")
      .select("line")
      .eq("user_id", authUser.id)
      .eq("is_default", true)
      .maybeSingle(),
  ]);

  return {
    id: authUser.id,
    fullName: profile?.full_name || (authUser.user_metadata.full_name as string | undefined) || "",
    email: authUser.email ?? "",
    phone: profile?.phone || (authUser.user_metadata.phone as string | undefined) || "",
    address: address?.line || "",
    role: (profile?.role as UserRole | undefined) || "customer",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function sync(authUser: AuthUser | null) {
      if (!authUser) {
        setUser(null);
        return;
      }
      setUser(await loadAppUser(authUser));
    }

    supabase.auth.getUser().then(({ data }) => {
      sync(data.user).finally(() => setReady(true));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      sync(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const supabase = createClient();
    const origin = window.location.origin;
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: {
          full_name: input.fullName,
          phone: input.phone,
          account_type: input.accountType,
          country_code: "CM",
        },
      },
    });
    if (error) throw error;
    if (!data.session) {
      throw new Error("Check your email to confirm the account, then log in.");
    }
    setUser(await loadAppUser(data.session.user));
  }, []);

  const login = useCallback(async (identifier: string, password: string, portal: "store" | "staff" = "store") => {
    const supabase = createClient();
    const email = identifier.includes("@")
      ? identifier.trim()
      : undefined;
    if (!email) {
      throw new Error("Log in with the email you registered.");
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error("Login failed");
    const appUser = await loadAppUser(data.user);
    if (portal === "staff" && appUser.role !== "admin") {
      await supabase.auth.signOut();
      setUser(null);
      throw new Error("Staff accounts only. Use the store login.");
    }
    if (portal === "store" && appUser.role === "admin") {
      await supabase.auth.signOut();
      setUser(null);
      throw new Error("Staff must sign in at the admin portal.");
    }
    setUser(appUser);
  }, []);

  const refreshUser = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      setUser(null);
      return;
    }
    setUser(await loadAppUser(authUser));
  }, []);

  const logout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (patch: Partial<User>) => {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return;

    if (patch.fullName !== undefined || patch.phone !== undefined) {
      const { error } = await supabase
        .from("profiles")
        .update({
          ...(patch.fullName !== undefined ? { full_name: patch.fullName } : {}),
          ...(patch.phone !== undefined ? { phone: patch.phone || null } : {}),
        })
        .eq("id", authUser.id);
      if (error) throw error;
    }

    if (patch.address !== undefined) {
      const { data: existing } = await supabase
        .from("addresses")
        .select("id")
        .eq("user_id", authUser.id)
        .eq("is_default", true)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase
          .from("addresses")
          .update({ line: patch.address })
          .eq("id", existing.id);
        if (error) throw error;
      } else if (patch.address) {
        const { error } = await supabase.from("addresses").insert({
          user_id: authUser.id,
          label: "Home",
          line: patch.address,
          is_default: true,
        });
        if (error) throw error;
      }
    }

    setUser((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const value = useMemo(
    () => ({ user, ready, register, login, logout, updateProfile, refreshUser }),
    [user, ready, register, login, logout, updateProfile, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
