import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../hooks/useAppDispatch';
import { RootStackParamList } from '../types';
import { colors, fontSize, fontWeight } from '../utils/theme';

// Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { AddBabyScreen } from '../screens/baby/AddBabyScreen';
import { LogFeedingScreen } from '../screens/feeding/LogFeedingScreen';
import { LogSleepScreen } from '../screens/sleep/LogSleepScreen';
import { LogMealScreen } from '../screens/meals/LogMealScreen';
import { LogSymptomScreen } from '../screens/symptoms/LogSymptomScreen';
import { LogMedicineScreen } from '../screens/medicines/LogMedicineScreen';
import { LogMoodScreen } from '../screens/mood/LogMoodScreen';
import { SharingScreen } from '../screens/sharing/SharingScreen';
import { GoalsScreen } from '../screens/settings/GoalsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const HistoryPlaceholder = () => {
  const React = require('react');
  const { View, Text, StyleSheet } = require('react-native');
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <Text style={{ fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text }}>Historial</Text>
      <Text style={{ fontSize: fontSize.md, color: colors.textSecondary, marginTop: 8 }}>Próximamente</Text>
    </View>
  );
};

const SettingsPlaceholder = () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <Text style={{ fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text }}>Configuración</Text>
      <Text style={{ fontSize: fontSize.md, color: colors.textSecondary, marginTop: 8 }}>Próximamente</Text>
    </View>
  );
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'History') iconName = focused ? 'time' : 'time-outline';
          else if (route.name === 'SettingsTab') iconName = focused ? 'settings' : 'settings-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: fontWeight.medium,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Inicio' }} />
      <Tab.Screen name="History" component={HistoryPlaceholder} options={{ tabBarLabel: 'Historial' }} />
      <Tab.Screen name="SettingsTab" component={SettingsPlaceholder} options={{ tabBarLabel: 'Ajustes' }} />
    </Tab.Navigator>
  );
}

export const AppNavigator: React.FC = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: fontWeight.semibold },
        headerShadowVisible: false,
      }}
    >
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: '' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="AddBaby" component={AddBabyScreen} options={{ title: 'Nuevo Bebé' }} />
          <Stack.Screen name="LogFeeding" component={LogFeedingScreen} options={{ title: 'Toma' }} />
          <Stack.Screen name="LogSleep" component={LogSleepScreen} options={{ title: 'Sueño' }} />
          <Stack.Screen name="LogMeal" component={LogMealScreen} options={{ title: 'Comida' }} />
          <Stack.Screen name="LogSymptom" component={LogSymptomScreen} options={{ title: 'Síntoma' }} />
          <Stack.Screen name="LogMedicine" component={LogMedicineScreen} options={{ title: 'Medicina' }} />
          <Stack.Screen name="LogMood" component={LogMoodScreen} options={{ title: 'Ánimo' }} />
          <Stack.Screen name="Sharing" component={SharingScreen} options={{ title: 'Compartir' }} />
          <Stack.Screen name="Goals" component={GoalsScreen} options={{ title: 'Metas' }} />
        </>
      )}
    </Stack.Navigator>
  );
};
