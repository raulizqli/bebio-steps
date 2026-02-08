import React, { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { apiFetch } from "../api";

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Babies: undefined;
  Baby: { babyId: string; babyName: string };
  Invite: { babyId: string };
};

export function InviteScreen({ route }: NativeStackScreenProps<RootStackParamList, "Invite">) {
  const { babyId } = route.params;
  const [role, setRole] = useState<"PARENT" | "FAMILY" | "NANNY">("NANNY");
  const [hours, setHours] = useState("8");
  const [code, setCode] = useState<string | null>(null);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ color: "#666" }}>
        Crea un código para compartir con nanny o familiar. Para nanny, usa horas para limitar el tiempo.
      </Text>

      <View style={{ borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 12, gap: 8 }}>
        <Text style={{ fontWeight: "600" }}>Rol</Text>
        <TextInput
          value={role}
          onChangeText={(t) => {
            const v = t.trim().toUpperCase();
            if (v === "PARENT" || v === "FAMILY" || v === "NANNY") setRole(v);
          }}
          placeholder="NANNY | FAMILY | PARENT"
          autoCapitalize="characters"
          style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 8 }}
        />

        <Text style={{ fontWeight: "600" }}>Expira en (horas)</Text>
        <TextInput
          value={hours}
          onChangeText={setHours}
          keyboardType="number-pad"
          placeholder="Ej. 8"
          style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 8 }}
        />

        <Button
          title="Generar código"
          onPress={async () => {
            try {
              const expiresInHours = Number(hours);
              if (!Number.isFinite(expiresInHours) || expiresInHours <= 0) throw new Error("Horas inválidas");
              const res = await apiFetch<{ invite: { code: string } }>(`/babies/${babyId}/invites`, {
                method: "POST",
                body: JSON.stringify({ role, expiresInHours }),
              });
              setCode(res.invite.code);
            } catch (e: any) {
              Alert.alert("Error", e?.message ?? "No se pudo crear el código");
            }
          }}
        />
      </View>

      {code && (
        <View style={{ borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 12, gap: 8 }}>
          <Text style={{ fontWeight: "700", fontSize: 18 }}>Código</Text>
          <Text selectable style={{ fontSize: 22, letterSpacing: 1 }}>
            {code}
          </Text>
          <Text style={{ color: "#666" }}>La otra persona debe usar “Unirme con código”.</Text>
        </View>
      )}
    </View>
  );
}

