import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { setAuthToken } from '../api/client';
import * as authApi from '../api/auth';
import type { User, Family } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  families: Family[];
  currentFamily: Family | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
  setCurrentFamily: (family: Family) => void;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  families: [],
  currentFamily: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const data = await authApi.login(email, password);
    setAuthToken(data.token);
    await SecureStore.setItemAsync('auth_token', data.token);

    set({
      user: data.user,
      token: data.token,
      families: data.families || [],
      currentFamily: data.families?.[0] || null,
      isAuthenticated: true,
    });
  },

  register: async (email, password, name) => {
    const data = await authApi.register(email, password, name);
    setAuthToken(data.token);
    await SecureStore.setItemAsync('auth_token', data.token);

    const families = data.family ? [data.family] : [];
    set({
      user: data.user,
      token: data.token,
      families,
      currentFamily: families[0] || null,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    setAuthToken(null);
    await SecureStore.deleteItemAsync('auth_token');
    set({
      user: null,
      token: null,
      families: [],
      currentFamily: null,
      isAuthenticated: false,
    });
  },

  loadToken: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        setAuthToken(token);
        const data = await authApi.getProfile();
        set({
          user: data.user,
          token,
          families: data.families,
          currentFamily: data.families[0] || null,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      await SecureStore.deleteItemAsync('auth_token');
      setAuthToken(null);
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  setCurrentFamily: (family) => {
    set({ currentFamily: family });
  },

  refreshProfile: async () => {
    try {
      const data = await authApi.getProfile();
      set({
        user: data.user,
        families: data.families,
      });
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  },
}));
