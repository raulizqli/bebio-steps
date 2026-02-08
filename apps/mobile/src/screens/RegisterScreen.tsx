import React, { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../auth/AuthContext";

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Babies: undefined;
  Baby: { babyId: string; babyName: string };
  Invite: { babyId: string };
};

export function RegisterScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "Register">) {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "600" }}>Crear cuenta</Text>
      <TextInput
        placeholder="Nombre"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 8 }}
      />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 8 }}
      />
      <TextInput
        placeholder="Contraseña (mín. 8)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 8 }}
      />

      <Button
        title={busy ? "..." : "Crear"}
        disabled={busy}
        onPress={async () => {
          try {
            setBusy(true);
            await register(name.trim(), email.trim(), password);
          } catch (e: any) {
            Alert.alert("Error", e?.message ?? "No se pudo registrar");
          } finally {
            setBusy(false);
          }
        }}
      />

      <Button title="Ya tengo cuenta" onPress={() => navigation.navigate("Login")} />
    </View>
  );
}

