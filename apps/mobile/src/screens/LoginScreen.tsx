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

export function LoginScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "Login">) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "600" }}>Bienvenido</Text>

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
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 8 }}
      />

      <Button
        title={busy ? "..." : "Entrar"}
        disabled={busy}
        onPress={async () => {
          try {
            setBusy(true);
            await login(email.trim(), password);
          } catch (e: any) {
            Alert.alert("Error", e?.message ?? "No se pudo iniciar sesión");
          } finally {
            setBusy(false);
          }
        }}
      />

      <Button title="Crear cuenta" onPress={() => navigation.navigate("Register")} />
    </View>
  );
}

