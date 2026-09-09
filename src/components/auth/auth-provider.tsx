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

export type User = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
};

type AuthState = {
  user: User | null;
  ready: boolean;
  register: (input: Omit<User, "id"> & { password: string }) => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (patch: Partial<User>) => void;
};

const USERS_KEY = "aidcelix.users";
const SESSION_KEY = "aidcelix.session";
const AuthContext = createContext<AuthState | null>(null);

type StoredUser = User & { password: string };

function readUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sessionId = localStorage.getItem(SESSION_KEY);
    const match = readUsers().find((item) => item.id === sessionId);
    if (match) {
      const { password: _password, ...safe } = match;
      setUser(safe);
    }
    setReady(true);
  }, []);

  const register = useCallback(async (input: Omit<User, "id"> & { password: string }) => {
    const users = readUsers();
    if (users.some((item) => item.email === input.email || item.phone === input.phone)) {
      throw new Error("An account already exists with this email or phone.");
    }
    const stored: StoredUser = { ...input, id: crypto.randomUUID() };
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, stored]));
    localStorage.setItem(SESSION_KEY, stored.id);
    const { password: _password, ...safe } = stored;
    setUser(safe);
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const match = readUsers().find(
      (item) =>
        (item.email === identifier || item.phone === identifier) && item.password === password,
    );
    if (!match) throw new Error("Incorrect email/phone or password.");
    localStorage.setItem(SESSION_KEY, match.id);
    const { password: _password, ...safe } = match;
    setUser(safe);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const updateProfile = useCallback((patch: Partial<User>) => {
    setUser((current) => {
      if (!current) return current;
      const next = { ...current, ...patch };
      const users = readUsers().map((item) =>
        item.id === current.id ? { ...item, ...patch } : item,
      );
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ user, ready, register, login, logout, updateProfile }),
    [user, ready, register, login, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
