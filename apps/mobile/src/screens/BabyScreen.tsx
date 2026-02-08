import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, FlatList, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "../api";

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Babies: undefined;
  Baby: { babyId: string; babyName: string };
  Invite: { babyId: string };
};

type Event = {
  id: string;
  type: string;
  occurredAt: string;
  startAt?: string | null;
  endAt?: string | null;
  amountOz?: number | null;
  notes?: string | null;
  mood?: string | null;
};

function fmt(dt: string) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return dt;
  }
}

export function BabyScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, "Baby">) {
  const { babyId } = route.params;
  const [events, setEvents] = useState<Event[]>([]);
  const [oz, setOz] = useState("");
  const [mood, setMood] = useState("");
  const [otherType, setOtherType] = useState<"MEAL" | "SYMPTOM" | "ILLNESS" | "MEDICINE">("MEAL");
  const [notes, setNotes] = useState("");

  const sleepKey = useMemo(() => `sleepStart:${babyId}`, [babyId]);
  const [sleepStart, setSleepStart] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await apiFetch<{ events: Event[] }>(`/babies/${babyId}/events?limit=50`);
    setEvents(res.events);
  }, [babyId]);

  useEffect(() => {
    load().catch(() => {});
    (async () => {
      const s = await AsyncStorage.getItem(sleepKey);
      setSleepStart(s);
    })();
  }, [load, sleepKey]);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Button title="Compartir" onPress={() => navigation.navigate("Invite", { babyId })} />
        <Button title="Recargar" onPress={() => load().catch(() => {})} />
      </View>

      <View style={{ borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 12, gap: 8 }}>
        <Text style={{ fontWeight: "600" }}>Toma (onzas)</Text>
        <TextInput
          placeholder="Ej. 4"
          value={oz}
          onChangeText={setOz}
          keyboardType="decimal-pad"
          style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 8 }}
        />
        <Button
          title="Registrar toma"
          onPress={async () => {
            try {
              const amountOz = Number(oz);
              if (!Number.isFinite(amountOz) || amountOz <= 0) throw new Error("Onzas inválidas");
              await apiFetch(`/babies/${babyId}/events`, {
                method: "POST",
                body: JSON.stringify({ type: "FEEDING", amountOz }),
              });
              setOz("");
              await load();
            } catch (e: any) {
              Alert.alert("Error", e?.message ?? "No se pudo guardar");
            }
          }}
        />
      </View>

      <View style={{ borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 12, gap: 8 }}>
        <Text style={{ fontWeight: "600" }}>Sueño</Text>
        <Text style={{ color: "#666" }}>
          {sleepStart ? `Durmiendo desde: ${fmt(sleepStart)}` : "No hay sesión de sueño en curso"}
        </Text>
        <Button
          title={sleepStart ? "Terminar sueño" : "Iniciar sueño"}
          onPress={async () => {
            try {
              if (!sleepStart) {
                const start = new Date().toISOString();
                await AsyncStorage.setItem(sleepKey, start);
                setSleepStart(start);
                return;
              }
              const end = new Date().toISOString();
              await apiFetch(`/babies/${babyId}/events`, {
                method: "POST",
                body: JSON.stringify({ type: "SLEEP", startAt: sleepStart, endAt: end }),
              });
              await AsyncStorage.removeItem(sleepKey);
              setSleepStart(null);
              await load();
            } catch (e: any) {
              Alert.alert("Error", e?.message ?? "No se pudo guardar");
            }
          }}
        />
      </View>

      <View style={{ borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 12, gap: 8 }}>
        <Text style={{ fontWeight: "600" }}>Ánimo</Text>
        <TextInput
          placeholder="Ej. tranquilo, irritable..."
          value={mood}
          onChangeText={setMood}
          style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 8 }}
        />
        <Button
          title="Registrar ánimo"
          onPress={async () => {
            try {
              const m = mood.trim();
              if (!m) throw new Error("Ánimo requerido");
              await apiFetch(`/babies/${babyId}/events`, { method: "POST", body: JSON.stringify({ type: "MOOD", mood: m }) });
              setMood("");
              await load();
            } catch (e: any) {
              Alert.alert("Error", e?.message ?? "No se pudo guardar");
            }
          }}
        />
      </View>

      <View style={{ borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 12, gap: 8 }}>
        <Text style={{ fontWeight: "600" }}>Comidas / Síntomas / Enfermedades / Medicinas</Text>
        <TextInput
          value={otherType}
          onChangeText={(t) => {
            const v = t.trim().toUpperCase();
            if (v === "MEAL" || v === "SYMPTOM" || v === "ILLNESS" || v === "MEDICINE") setOtherType(v);
          }}
          placeholder="MEAL | SYMPTOM | ILLNESS | MEDICINE"
          autoCapitalize="characters"
          style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 8 }}
        />
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Notas (ej. puré de manzana, fiebre, ibuprofeno...)"
          style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 8 }}
        />
        <Button
          title="Registrar"
          onPress={async () => {
            try {
              const n = notes.trim();
              if (!n) throw new Error("Notas requeridas");
              await apiFetch(`/babies/${babyId}/events`, { method: "POST", body: JSON.stringify({ type: otherType, notes: n }) });
              setNotes("");
              await load();
            } catch (e: any) {
              Alert.alert("Error", e?.message ?? "No se pudo guardar");
            }
          }}
        />
      </View>

      <Text style={{ fontSize: 16, fontWeight: "600" }}>Últimos eventos</Text>
      <FlatList
        data={events}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderWidth: 1, borderColor: "#eee", borderRadius: 12, marginBottom: 10 }}>
            <Text style={{ fontWeight: "700" }}>{item.type}</Text>
            <Text style={{ color: "#666" }}>{fmt(item.occurredAt)}</Text>
            {!!item.amountOz && <Text>{item.amountOz} oz</Text>}
            {!!item.mood && <Text>Ánimo: {item.mood}</Text>}
            {!!item.startAt && !!item.endAt && <Text>Sueño: {fmt(item.startAt)} → {fmt(item.endAt)}</Text>}
            {!!item.notes && <Text>Notas: {item.notes}</Text>}
          </View>
        )}
      />
    </View>
  );
}

