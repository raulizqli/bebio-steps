import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "bebio_token";

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string | null) {
  if (!token) return SecureStore.deleteItemAsync(TOKEN_KEY);
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export function getApiBaseUrl() {
  const fromExtra = (Constants.expoConfig?.extra as any)?.apiBaseUrl;
  const fromEnv = (process.env as any).EXPO_PUBLIC_API_BASE_URL;
  const base = (fromEnv || fromExtra || "http://localhost:3001").toString();
  return base.replace(/\/+$/, "");
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const token = await getToken();
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${baseUrl}${path}`, { ...init, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(data?.error || `HTTP_${res.status}`);
  }
  return data as T;
}

