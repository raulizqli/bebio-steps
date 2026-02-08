import api from '../config/api';

export interface Mood {
  _id: string;
  baby: string;
  mood: 'happy' | 'calm' | 'fussy' | 'crying' | 'sleeping' | 'alert';
  intensity: number;
  timestamp: Date;
  triggers?: string[];
  notes?: string;
  recordedBy: string;
}

export const moodService = {
  async createMood(data: Partial<Mood>): Promise<Mood> {
    const response = await api.post('/mood', data);
    return response.data.mood;
  },

  async getMoods(babyId: string, params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ moods: Mood[]; total: number }> {
    const response = await api.get(`/mood/${babyId}`, { params });
    return response.data;
  },

  async updateMood(moodId: string, data: Partial<Mood>): Promise<Mood> {
    const response = await api.put(`/mood/${moodId}`, data);
    return response.data.mood;
  },

  async deleteMood(moodId: string): Promise<void> {
    await api.delete(`/mood/${moodId}`);
  },
};
