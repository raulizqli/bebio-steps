import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import BabyListScreen from './src/screens/BabyListScreen';
import AddBabyScreen from './src/screens/AddBabyScreen';
import FeedingScreen from './src/screens/FeedingScreen';
import SleepScreen from './src/screens/SleepScreen';
import MealScreen from './src/screens/MealScreen';
import IllnessScreen from './src/screens/IllnessScreen';
import MedicationScreen from './src/screens/MedicationScreen';
import MoodScreen from './src/screens/MoodScreen';
import ShareScreen from './src/screens/ShareScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Context
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { BabyProvider } from './src/context/BabyContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Inicio' }}
      />
      <Tab.Screen 
        name="Babies" 
        component={BabyListScreen}
        options={{ title: 'Bebés' }}
      />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{ title: 'Notificaciones' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!user ? (
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen}
              options={{ title: 'Registrarse' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="AddBaby" 
              component={AddBabyScreen}
              options={{ title: 'Agregar Bebé' }}
            />
            <Stack.Screen 
              name="Feeding" 
              component={FeedingScreen}
              options={{ title: 'Alimentación' }}
            />
            <Stack.Screen 
              name="Sleep" 
              component={SleepScreen}
              options={{ title: 'Sueño' }}
            />
            <Stack.Screen 
              name="Meal" 
              component={MealScreen}
              options={{ title: 'Comidas' }}
            />
            <Stack.Screen 
              name="Illness" 
              component={IllnessScreen}
              options={{ title: 'Enfermedades' }}
            />
            <Stack.Screen 
              name="Medication" 
              component={MedicationScreen}
              options={{ title: 'Medicamentos' }}
            />
            <Stack.Screen 
              name="Mood" 
              component={MoodScreen}
              options={{ title: 'Estado de Ánimo' }}
            />
            <Stack.Screen 
              name="Share" 
              component={ShareScreen}
              options={{ title: 'Compartir Acceso' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BabyProvider>
        <AppNavigator />
      </BabyProvider>
    </AuthProvider>
  );
}
