import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type AuthContextValue = {
  loading: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const TOKEN_KEY = "expense-tracker.token";

const AuthContext = createContext<AuthContextValue | null>(null);

function getApiBaseUrl() {
  const url = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!url) throw new Error("EXPO_PUBLIC_API_BASE_URL is not set");
  return url.replace(/\/+$/, "");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    SecureStore.getItemAsync(TOKEN_KEY)
      .then((t) => {
        if (!cancelled) setToken(t);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      token,
      async login(email, password) {
        const base = getApiBaseUrl();
        const res = await fetch(`${base}/api/auth/mobile-login`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const json = (await res.json().catch(() => null)) as
          | { token?: string; error?: string }
          | null;

        if (!res.ok || !json?.token) {
          throw new Error(json?.error ?? "Login failed");
        }

        await SecureStore.setItemAsync(TOKEN_KEY, json.token);
        setToken(json.token);
      },
      async logout() {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        setToken(null);
      },
    }),
    [loading, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useAuthedFetch() {
  const { token } = useAuth();
  return async function authedFetch(path: string, init?: RequestInit) {
    const base = getApiBaseUrl();
    const headers = new Headers(init?.headers ?? undefined);
    headers.set("content-type", "application/json");
    if (token) headers.set("authorization", `Bearer ${token}`);
    return fetch(`${base}${path.startsWith("/") ? path : `/${path}`}`, {
      ...init,
      headers,
    });
  };
}

