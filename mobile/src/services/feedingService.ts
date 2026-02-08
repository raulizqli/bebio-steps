import api from '../config/api';

export interface Feeding {
  _id: string;
  baby: string;
  type: 'breast' | 'bottle' | 'solid';
  amount?: number;
  unit: 'oz' | 'ml' | 'servings';
  side?: 'left' | 'right' | 'both';
  duration?: number;
  startTime: Date;
  endTime?: Date;
  notes?: string;
  recordedBy: string;
}

export const feedingService = {
  async createFeeding(data: Partial<Feeding>): Promise<Feeding> {
    const response = await api.post('/feedings', data);
    return response.data.feeding;
  },

  async getFeedings(babyId: string, params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ feedings: Feeding[]; total: number }> {
    const response = await api.get(`/feedings/${babyId}`, { params });
    return response.data;
  },

  async getDailyStats(babyId: string, date?: string): Promise<any> {
    const response = await api.get(`/feedings/${babyId}/stats/daily`, {
      params: { date },
    });
    return response.data;
  },

  async updateFeeding(feedingId: string, data: Partial<Feeding>): Promise<Feeding> {
    const response = await api.put(`/feedings/${feedingId}`, data);
    return response.data.feeding;
  },

  async deleteFeeding(feedingId: string): Promise<void> {
    await api.delete(`/feedings/${feedingId}`);
  },
};
