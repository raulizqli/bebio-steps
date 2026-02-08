import apiClient from './client';
import type { User, Family } from '../types';

interface AuthResponse {
  user: User;
  token: string;
  family?: Family;
  families?: Family[];
}

export async function register(email: string, password: string, name: string): Promise<AuthResponse> {
  const { data } = await apiClient.post('/auth/register', { email, password, name });
  return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post('/auth/login', { email, password });
  return data;
}

export async function getProfile(): Promise<{ user: User; families: Family[] }> {
  const { data } = await apiClient.get('/auth/me');
  return data;
}

export async function addParent(email: string, familyId: string): Promise<void> {
  await apiClient.post('/auth/add-parent', { email, family_id: familyId });
}
