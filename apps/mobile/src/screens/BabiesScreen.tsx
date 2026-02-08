import React, { useCallback, useEffect, useState } from "react";
import { Alert, Button, FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { apiFetch } from "../api";
import { useAuth } from "../auth/AuthContext";

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Babies: undefined;
  Baby: { babyId: string; babyName: string };
  Invite: { babyId: string };
};

type Baby = { id: string; name: string };

export function BabiesScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "Babies">) {
  const { logout } = useAuth();
  const [babies, setBabies] = useState<Baby[]>([]);
  const [newName, setNewName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const load = useCallback(async () => {
    const res = await apiFetch<{ babies: Baby[] }>("/babies");
    setBabies(res.babies);
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener("focus", () => {
      load().catch(() => {});
    });
    return unsub;
  }, [navigation, load]);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>Tus bebés</Text>
        <Button title="Salir" onPress={() => logout()} />
      </View>

      <View style={{ borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 12, gap: 8 }}>
        <Text style={{ fontWeight: "600" }}>Crear bebé</Text>
        <TextInput
          placeholder="Nombre"
          value={newName}
          onChangeText={setNewName}
          style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 8 }}
        />
        <Button
          title="Crear"
          onPress={async () => {
            try {
              const res = await apiFetch<{ baby: Baby }>("/babies", { method: "POST", body: JSON.stringify({ name: newName.trim() }) });
              setNewName("");
              setBabies((b) => [res.baby, ...b]);
            } catch (e: any) {
              Alert.alert("Error", e?.message ?? "No se pudo crear");
            }
          }}
        />
      </View>

      <View style={{ borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 12, gap: 8 }}>
        <Text style={{ fontWeight: "600" }}>Unirme con código</Text>
        <TextInput
          placeholder="Código"
          value={joinCode}
          onChangeText={setJoinCode}
          autoCapitalize="none"
          style={{ borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 8 }}
        />
        <Button
          title="Aceptar invitación"
          onPress={async () => {
            try {
              await apiFetch("/invites/accept", { method: "POST", body: JSON.stringify({ code: joinCode.trim() }) });
              setJoinCode("");
              await load();
            } catch (e: any) {
              Alert.alert("Error", e?.message ?? "No se pudo aceptar");
            }
          }}
        />
      </View>

      <FlatList
        data={babies}
        keyExtractor={(b) => b.id}
        ListEmptyComponent={<Text style={{ color: "#666" }}>Aún no hay bebés.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate("Baby", { babyId: item.id, babyName: item.name })}
            style={{ padding: 14, borderWidth: 1, borderColor: "#eee", borderRadius: 12, marginBottom: 10 }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600" }}>{item.name}</Text>
            <Text style={{ color: "#666" }}>Ver eventos y compartir acceso</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

