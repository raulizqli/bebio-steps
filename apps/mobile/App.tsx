import React, { useEffect, useState } from "react";
import { SafeAreaView, Text, TextInput, View, Pressable, ScrollView, ActivityIndicator } from "react-native";

import { apiFetch, getApiBaseUrl, getToken, setToken } from "./src/api";

type AuthResponse = { token: string; user: { id: string; email: string; name?: string | null } };
type Household = { id: string; name: string; createdAt: string; role: string; expiresAt: string | null };
type Child = { id: string; name: string; birthDate: string | null; goalSettings?: any };

function Button(props: { title: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      style={{
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor: props.disabled ? "#999" : "#111",
        alignItems: "center",
      }}
    >
      <Text style={{ color: "white", fontWeight: "600" }}>{props.title}</Text>
    </Pressable>
  );
}

function Field(props: { label: string; value: string; onChangeText: (t: string) => void; placeholder?: string; secureTextEntry?: boolean }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontWeight: "600" }}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        secureTextEntry={props.secureTextEntry}
        autoCapitalize="none"
        style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12 }}
      />
    </View>
  );
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [token, setTokenState] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const t = await getToken();
      setTokenState(t);
      setBooting(false);
    })();
  }, []);

  if (booting) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!token) {
    return <AuthScreen onAuthed={async (t) => { await setToken(t); setTokenState(t); }} />;
  }

  return <HomeScreen onLogout={async () => { await setToken(null); setTokenState(null); }} />;
}

function AuthScreen(props: { onAuthed: (token: string) => Promise<void> }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const body: any = { email, password };
      if (mode === "register") body.name = name;
      const res = await apiFetch<AuthResponse>(path, { method: "POST", body: JSON.stringify(body) });
      await props.onAuthed(res.token);
    } catch (e: any) {
      setError(e?.message ?? "ERROR");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: "800" }}>Bebio</Text>
        <Text style={{ color: "#666" }}>API: {getApiBaseUrl()}</Text>

        {mode === "register" ? <Field label="Nombre" value={name} onChangeText={setName} placeholder="Mamá / Papá" /> : null}
        <Field label="Email" value={email} onChangeText={setEmail} placeholder="tu@email.com" />
        <Field label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry placeholder="mínimo 8 caracteres" />

        {error ? <Text style={{ color: "#b00020" }}>{error}</Text> : null}
        <Button title={loading ? "Cargando..." : mode === "login" ? "Entrar" : "Crear cuenta"} onPress={submit} disabled={loading} />

        <Pressable onPress={() => setMode(mode === "login" ? "register" : "login")} style={{ paddingVertical: 10 }}>
          <Text style={{ color: "#111", textDecorationLine: "underline" }}>
            {mode === "login" ? "Crear cuenta" : "Ya tengo cuenta"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function HomeScreen(props: { onLogout: () => Promise<void> }) {
  const [me, setMe] = useState<{ user: any; households: Household[] } | null>(null);
  const [householdName, setHouseholdName] = useState("");
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [childName, setChildName] = useState("");
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [redeemCode, setRedeemCode] = useState("");
  const [grantExpiresAt, setGrantExpiresAt] = useState(""); // ISO string (optional)
  const [grantNote, setGrantNote] = useState("Nanny");
  const [createdGrantCode, setCreatedGrantCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshMe() {
    const data = await apiFetch<{ user: any; households: Household[] }>("/me");
    setMe(data);
    if (!selectedHouseholdId && data.households.length > 0) setSelectedHouseholdId(data.households[0].id);
  }

  useEffect(() => {
    refreshMe().catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      if (!selectedHouseholdId) return;
      const data = await apiFetch<{ children: Child[] }>(`/households/${selectedHouseholdId}/children`);
      setChildren(data.children);
      if (!selectedChildId && data.children.length > 0) setSelectedChildId(data.children[0].id);
    })().catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHouseholdId]);

  async function createHousehold() {
    setError(null);
    const res = await apiFetch<{ household: { id: string } }>("/households", { method: "POST", body: JSON.stringify({ name: householdName }) });
    setHouseholdName("");
    await refreshMe();
    setSelectedHouseholdId(res.household.id);
  }

  async function redeemGrant() {
    setError(null);
    await apiFetch("/grants/redeem", { method: "POST", body: JSON.stringify({ code: redeemCode }) });
    setRedeemCode("");
    await refreshMe();
  }

  async function createChild() {
    if (!selectedHouseholdId) return;
    setError(null);
    const res = await apiFetch<{ child: Child }>(`/households/${selectedHouseholdId}/children`, { method: "POST", body: JSON.stringify({ name: childName }) });
    setChildName("");
    const data = await apiFetch<{ children: Child[] }>(`/households/${selectedHouseholdId}/children`);
    setChildren(data.children);
    setSelectedChildId(res.child.id);
  }

  async function createGrant() {
    if (!selectedHouseholdId) return;
    setError(null);
    const body: any = {
      note: grantNote,
      role: "CAREGIVER",
      maxUses: 1,
      // Example: nanny can read + write feeding/sleep, but not manage members
      permissions: { canRead: true, canWriteFeeding: true, canWriteSleep: true, canWriteMeal: true, canWriteMedicine: true, canWriteMood: true, canManageMembers: false }
    };
    if (grantExpiresAt.trim()) body.expiresAt = grantExpiresAt.trim();
    const res = await apiFetch<{ grant: { code: string } }>(`/households/${selectedHouseholdId}/grants`, { method: "POST", body: JSON.stringify(body) });
    setCreatedGrantCode(res.grant.code);
  }

  async function logFeeding() {
    if (!selectedChildId) return;
    setError(null);
    await apiFetch(`/children/${selectedChildId}/feedings`, {
      method: "POST",
      body: JSON.stringify({ startedAt: new Date().toISOString(), ounces: 4, type: "BOTTLE" }),
    });
  }

  async function logSleep() {
    if (!selectedChildId) return;
    setError(null);
    const start = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const end = new Date().toISOString();
    await apiFetch(`/children/${selectedChildId}/sleeps`, { method: "POST", body: JSON.stringify({ startedAt: start, endedAt: end }) });
  }

  async function runGoalsCheck() {
    if (!selectedChildId) return;
    setError(null);
    await apiFetch(`/notifications/run`, { method: "POST", body: JSON.stringify({ childId: selectedChildId, day: new Date().toISOString() }) });
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 18, fontWeight: "800" }}>Panel</Text>
          <Pressable onPress={props.onLogout}>
            <Text style={{ color: "#111", textDecorationLine: "underline" }}>Salir</Text>
          </Pressable>
        </View>

        {error ? <Text style={{ color: "#b00020" }}>{error}</Text> : null}

        <View style={{ gap: 10, padding: 14, borderWidth: 1, borderColor: "#eee", borderRadius: 12 }}>
          <Text style={{ fontWeight: "700" }}>Familia</Text>
          <Text style={{ color: "#666" }}>Seleccionada: {selectedHouseholdId ?? "(ninguna)"}</Text>
          <View style={{ gap: 8 }}>
            <Field label="Crear familia" value={householdName} onChangeText={setHouseholdName} placeholder="Casa López" />
            <Button title="Crear" onPress={createHousehold} disabled={!householdName.trim()} />
          </View>
          {me?.households?.length ? (
            <View style={{ gap: 6 }}>
              <Text style={{ fontWeight: "600" }}>Tus familias</Text>
              {me.households.map((h) => (
                <Pressable key={h.id} onPress={() => setSelectedHouseholdId(h.id)} style={{ paddingVertical: 6 }}>
                  <Text style={{ color: h.id === selectedHouseholdId ? "#111" : "#666" }}>
                    {h.name} ({h.role}{h.expiresAt ? `, expira ${h.expiresAt}` : ""})
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <View style={{ gap: 10, padding: 14, borderWidth: 1, borderColor: "#eee", borderRadius: 12 }}>
          <Text style={{ fontWeight: "700" }}>Invitar / Compartir (nanny/familiar)</Text>
          <Field
            label="Expira (ISO, opcional)"
            value={grantExpiresAt}
            onChangeText={setGrantExpiresAt}
            placeholder="2026-02-10T12:00:00.000Z"
          />
          <Field label="Nota" value={grantNote} onChangeText={setGrantNote} placeholder="Nanny" />
          <Button title="Crear código" onPress={createGrant} disabled={!selectedHouseholdId} />
          {createdGrantCode ? <Text style={{ fontWeight: "700" }}>Código: {createdGrantCode}</Text> : null}

          <Field label="Canjear código" value={redeemCode} onChangeText={setRedeemCode} placeholder="pega aquí" />
          <Button title="Canjear" onPress={redeemGrant} disabled={!redeemCode.trim()} />
        </View>

        <View style={{ gap: 10, padding: 14, borderWidth: 1, borderColor: "#eee", borderRadius: 12 }}>
          <Text style={{ fontWeight: "700" }}>Bebé</Text>
          <Text style={{ color: "#666" }}>Seleccionado: {selectedChildId ?? "(ninguno)"}</Text>
          {children.map((c) => (
            <Pressable key={c.id} onPress={() => setSelectedChildId(c.id)} style={{ paddingVertical: 6 }}>
              <Text style={{ color: c.id === selectedChildId ? "#111" : "#666" }}>{c.name}</Text>
            </Pressable>
          ))}
          <Field label="Crear bebé" value={childName} onChangeText={setChildName} placeholder="Bebé" />
          <Button title="Crear bebé" onPress={createChild} disabled={!selectedHouseholdId || !childName.trim()} />
        </View>

        <View style={{ gap: 10, padding: 14, borderWidth: 1, borderColor: "#eee", borderRadius: 12 }}>
          <Text style={{ fontWeight: "700" }}>Acciones rápidas</Text>
          <Button title="Registrar toma (4oz)" onPress={logFeeding} disabled={!selectedChildId} />
          <Button title="Registrar sueño (última hora)" onPress={logSleep} disabled={!selectedChildId} />
          <Button title="Checar metas (notificaciones)" onPress={runGoalsCheck} disabled={!selectedChildId} />
        </View>

        <View style={{ paddingBottom: 40 }}>
          <Text style={{ color: "#666" }}>
            Nota: esta es una base MVP. La app completa puede extenderse con pantallas dedicadas para tomas/sueño/comidas/síntomas/enfermedades/medicinas/ánimo y gestión avanzada de permisos.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

