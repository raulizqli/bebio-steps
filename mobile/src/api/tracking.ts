import apiClient from './client';
import type {
  Feeding, SleepRecord, Meal, Symptom,
  Illness, Medicine, MoodRecord, DailySummary, TimelineEvent
} from '../types';

// Feedings
export async function logFeeding(data: Partial<Feeding>): Promise<Feeding> {
  const response = await apiClient.post('/tracking/feedings', data);
  return response.data.feeding;
}

export async function getFeedings(babyId: string, date?: string): Promise<{
  feedings: Feeding[];
  daily_total: { total_oz: number; count: number };
}> {
  const params = date ? { date } : {};
  const response = await apiClient.get(`/tracking/feedings/${babyId}`, { params });
  return response.data;
}

export async function deleteFeeding(id: string): Promise<void> {
  await apiClient.delete(`/tracking/feedings/${id}`);
}

// Sleep
export async function logSleep(data: Partial<SleepRecord>): Promise<SleepRecord> {
  const response = await apiClient.post('/tracking/sleep', data);
  return response.data.sleep;
}

export async function endSleep(id: string, endedAt: string, quality?: string): Promise<SleepRecord> {
  const response = await apiClient.patch(`/tracking/sleep/${id}/end`, { ended_at: endedAt, quality });
  return response.data.sleep;
}

export async function getSleepRecords(babyId: string, date?: string): Promise<{
  sleep_records: SleepRecord[];
  daily_total: { total_hours: number; count: number };
}> {
  const params = date ? { date } : {};
  const response = await apiClient.get(`/tracking/sleep/${babyId}`, { params });
  return response.data;
}

// Meals
export async function logMeal(data: Partial<Meal>): Promise<Meal> {
  const response = await apiClient.post('/tracking/meals', data);
  return response.data.meal;
}

export async function getMeals(babyId: string, date?: string): Promise<{ meals: Meal[] }> {
  const params = date ? { date } : {};
  const response = await apiClient.get(`/tracking/meals/${babyId}`, { params });
  return response.data;
}

// Symptoms
export async function logSymptom(data: Partial<Symptom>): Promise<Symptom> {
  const response = await apiClient.post('/tracking/symptoms', data);
  return response.data.symptom;
}

export async function getSymptoms(babyId: string): Promise<{ symptoms: Symptom[] }> {
  const response = await apiClient.get(`/tracking/symptoms/${babyId}`);
  return response.data;
}

export async function resolveSymptom(id: string): Promise<void> {
  await apiClient.patch(`/tracking/symptoms/${id}/resolve`);
}

// Illnesses
export async function logIllness(data: Partial<Illness>): Promise<Illness> {
  const response = await apiClient.post('/tracking/illnesses', data);
  return response.data.illness;
}

export async function getIllnesses(babyId: string): Promise<{ illnesses: Illness[] }> {
  const response = await apiClient.get(`/tracking/illnesses/${babyId}`);
  return response.data;
}

export async function resolveIllness(id: string): Promise<void> {
  await apiClient.patch(`/tracking/illnesses/${id}/resolve`);
}

// Medicines
export async function logMedicine(data: Partial<Medicine>): Promise<Medicine> {
  const response = await apiClient.post('/tracking/medicines', data);
  return response.data.medicine;
}

export async function getMedicines(babyId: string): Promise<{ medicines: Medicine[] }> {
  const response = await apiClient.get(`/tracking/medicines/${babyId}`);
  return response.data;
}

// Moods
export async function logMood(data: Partial<MoodRecord>): Promise<MoodRecord> {
  const response = await apiClient.post('/tracking/moods', data);
  return response.data.mood;
}

export async function getMoods(babyId: string, date?: string): Promise<{ moods: MoodRecord[] }> {
  const params = date ? { date } : {};
  const response = await apiClient.get(`/tracking/moods/${babyId}`, { params });
  return response.data;
}

// Summary & Timeline
export async function getDailySummary(babyId: string, date?: string): Promise<DailySummary> {
  const params = date ? { date } : {};
  const response = await apiClient.get(`/tracking/summary/${babyId}`, { params });
  return response.data.summary;
}

export async function getTimeline(babyId: string, date?: string): Promise<{
  timeline: TimelineEvent[];
  total: number;
}> {
  const params = date ? { date } : {};
  const response = await apiClient.get(`/tracking/timeline/${babyId}`, { params });
  return response.data;
}
