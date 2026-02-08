import api from '../config/api';

export interface Sleep {
  _id: string;
  baby: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  quality?: 'poor' | 'fair' | 'good' | 'excellent';
  location?: string;
  notes?: string;
  recordedBy: string;
}

export const sleepService = {
  async createSleep(data: Partial<Sleep>): Promise<Sleep> {
    const response = await api.post('/sleep', data);
    return response.data.sleep;
  },

  async getSleeps(babyId: string, params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ sleeps: Sleep[]; total: number }> {
    const response = await api.get(`/sleep/${babyId}`, { params });
    return response.data;
  },

  async getDailyStats(babyId: string, date?: string): Promise<any> {
    const response = await api.get(`/sleep/${babyId}/stats/daily`, {
      params: { date },
    });
    return response.data;
  },

  async updateSleep(sleepId: string, data: Partial<Sleep>): Promise<Sleep> {
    const response = await api.put(`/sleep/${sleepId}`, data);
    return response.data.sleep;
  },

  async deleteSleep(sleepId: string): Promise<void> {
    await api.delete(`/sleep/${sleepId}`);
  },
};
