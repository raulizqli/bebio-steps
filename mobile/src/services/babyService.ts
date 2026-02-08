import api from '../config/api';

export interface Baby {
  _id: string;
  name: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  parents: string[];
  photoUrl?: string;
  weight?: number;
  height?: number;
  bloodType?: string;
  allergies?: string[];
}

export const babyService = {
  async createBaby(data: Partial<Baby>): Promise<Baby> {
    const response = await api.post('/babies', data);
    return response.data.baby;
  },

  async getBabies(): Promise<Baby[]> {
    const response = await api.get('/babies');
    return response.data.babies;
  },

  async getBaby(babyId: string): Promise<Baby> {
    const response = await api.get(`/babies/${babyId}`);
    return response.data.baby;
  },

  async updateBaby(babyId: string, data: Partial<Baby>): Promise<Baby> {
    const response = await api.put(`/babies/${babyId}`, data);
    return response.data.baby;
  },

  async deleteBaby(babyId: string): Promise<void> {
    await api.delete(`/babies/${babyId}`);
  },
};
