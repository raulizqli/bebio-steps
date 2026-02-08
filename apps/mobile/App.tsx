import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ActivityIndicator, View } from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AuthProvider, useAuth } from "./src/auth/AuthContext";
import { apiFetch } from "./src/api";
import { LoginScreen } from "./src/screens/LoginScreen";
import { RegisterScreen } from "./src/screens/RegisterScreen";
import { BabiesScreen } from "./src/screens/BabiesScreen";
import { BabyScreen } from "./src/screens/BabyScreen";
import { InviteScreen } from "./src/screens/InviteScreen";

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Babies: undefined;
  Baby: { babyId: string; babyName: string };
  Invite: { babyId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function AppNav() {
  const { isLoading, token } = useAuth();

  useEffect(() => {
    (async () => {
      if (!token) return;
      try {
        const perm = await Notifications.getPermissionsAsync();
        if (!perm.granted) {
          const req = await Notifications.requestPermissionsAsync();
          if (!req.granted) return;
        }
        const expoToken = (await Notifications.getExpoPushTokenAsync()).data;
        const last = await AsyncStorage.getItem("expoPushToken");
        if (last === expoToken) return;
        await apiFetch("/me/push-tokens", { method: "POST", body: JSON.stringify({ token: expoToken, platform: "expo" }) });
        await AsyncStorage.setItem("expoPushToken", expoToken);
      } catch {
        // best-effort
      }
    })();
  }, [token]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {token ? (
        <>
          <Stack.Screen name="Babies" component={BabiesScreen} options={{ title: "Bebés" }} />
          <Stack.Screen name="Baby" component={BabyScreen} options={({ route }) => ({ title: route.params.babyName })} />
          <Stack.Screen name="Invite" component={InviteScreen} options={{ title: "Compartir acceso" }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Iniciar sesión" }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Crear cuenta" }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AuthProvider>
          <AppNav />
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

