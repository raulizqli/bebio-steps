import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "../api";

type AuthState = {
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem("token");
      setToken(t);
      setIsLoading(false);
    })();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      token,
      isLoading,
      login: async (email, password) => {
        const res = await apiFetch<{ token: string }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        await AsyncStorage.setItem("token", res.token);
        setToken(res.token);
      },
      register: async (name, email, password) => {
        const res = await apiFetch<{ token: string }>("/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
        await AsyncStorage.setItem("token", res.token);
        setToken(res.token);
      },
      logout: async () => {
        await AsyncStorage.removeItem("token");
        setToken(null);
      },
    }),
    [token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}

