import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await AsyncStorage.getItem("token");
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...(init.headers as any),
  };
  if (token) headers.authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = json?.error ?? "Request failed";
    throw new Error(message);
  }
  return json as T;
}

