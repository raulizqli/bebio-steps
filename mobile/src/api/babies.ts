import apiClient from './client';
import type { Baby, DailyGoal, DailySummary } from '../types';

export async function createBaby(data: {
  family_id: string;
  name: string;
  birth_date: string;
  gender?: string;
  weight_at_birth?: number;
  height_at_birth?: number;
}): Promise<Baby> {
  const response = await apiClient.post('/babies', data);
  return response.data.baby;
}

export async function getBabies(familyId: string): Promise<Baby[]> {
  const { data } = await apiClient.get(`/babies/family/${familyId}`);
  return data.babies;
}

export async function getBabyDetails(babyId: string): Promise<{
  baby: Baby;
  goals: DailyGoal[];
  today: any;
}> {
  const { data } = await apiClient.get(`/babies/${babyId}`);
  return data;
}

export async function updateBaby(babyId: string, updates: Partial<Baby>): Promise<Baby> {
  const { data } = await apiClient.put(`/babies/${babyId}`, updates);
  return data.baby;
}

export async function setGoal(babyId: string, goalType: string, targetValue: number): Promise<void> {
  await apiClient.post(`/babies/${babyId}/goals`, {
    goal_type: goalType,
    target_value: targetValue,
  });
}
